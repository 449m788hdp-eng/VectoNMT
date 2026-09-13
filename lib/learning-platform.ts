import { getDatabase, kyivDate } from "./server-data";
import { normalizeAnswer, pointsFor } from "./nmt-scoring";

type Row = Record<string, any>;
export class PlatformError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const now = () => Math.floor(Date.now() / 1000);
const parse = (v: string) => JSON.parse(v);
const rows = async (sql: string, ...args: any[]) =>
  (
    await getDatabase()
      .prepare(sql)
      .bind(...args)
      .all<Row>()
  ).results;
const one = async (sql: string, ...args: any[]) =>
  getDatabase()
    .prepare(sql)
    .bind(...args)
    .first<Row>();

export async function catalog(): Promise<Row[]> {
  const [subjects, topics] = await Promise.all([
    rows(
      `SELECT s.*, e.config_json, e.year, COUNT(q.id) question_count, SUM(CASE WHEN q.source_kind='official' THEN 1 ELSE 0 END) official_count FROM subjects s JOIN exam_configs e ON e.subject_slug=s.slug LEFT JOIN questions q ON q.subject_slug=s.slug AND q.active=1 GROUP BY s.slug ORDER BY s.position`,
    ),
    rows(
      `SELECT t.*,COUNT(q.id) question_count FROM topics t LEFT JOIN questions q ON q.topic_id=t.id AND q.active=1 WHERE t.position>=0 AND t.section_name!='Поза програмою НМТ-2026' GROUP BY t.id ORDER BY t.subject_slug,t.position,t.name`,
    ),
  ]);
  return subjects.map((s) => ({
    ...s,
    config: parse(s.config_json),
    config_json: undefined,
    topics: topics.filter((t) => t.subject_slug === s.slug),
  }));
}

export async function overview(user: string) {
  const [profile, history, active, topicStats] = await Promise.all([
    one("SELECT * FROM profiles WHERE user_id=?", user),
    rows(
      `SELECT id,title,mode,completed_at,result_json FROM learning_sessions WHERE user_id=? AND status='completed' ORDER BY completed_at DESC LIMIT 100`,
      user,
    ),
    rows(
      `SELECT id,title,mode,status,stage,revision FROM learning_sessions WHERE user_id=? AND status IN ('active','break') ORDER BY created_at DESC`,
      user,
    ),
    rows(
      `SELECT t.name,t.subject_slug,SUM(i.points) earned,SUM(i.max_points) maximum,COUNT(*) count FROM session_items i JOIN learning_sessions s ON s.id=i.session_id JOIN topics t ON t.id=i.topic_id WHERE s.user_id=? AND s.status='completed' GROUP BY t.id ORDER BY 1.0*SUM(i.points)/SUM(i.max_points) LIMIT 12`,
      user,
    ),
  ]);
  const totals = await one(
    `SELECT COUNT(DISTINCT s.id) tests,SUM(i.points) earned,SUM(i.max_points) maximum,COUNT(i.question_id) questions FROM learning_sessions s JOIN session_items i ON i.session_id=s.id WHERE s.user_id=? AND s.status='completed'`,
    user,
  );
  const days = await rows(
    `SELECT completed_at FROM learning_sessions WHERE user_id=? AND status='completed' ORDER BY completed_at DESC`,
    user,
  );
  let streak = 0;
  const dates = new Set(days.map((d) => kyivDate(new Date(d.completed_at))));
  const date = new Date();
  if (!dates.has(kyivDate(date))) date.setDate(date.getDate() - 1);
  while (dates.has(kyivDate(date))) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  const legacy = await one(
    "SELECT COUNT(*) count FROM test_attempts WHERE user_id=? AND completed_at IS NOT NULL",
    user,
  );
  return {
    profile,
    history: history.map((h) => ({
      ...h,
      result: parse(h.result_json),
      result_json: undefined,
    })),
    active,
    topicStats,
    stats: { ...totals, streak, legacy: legacy?.count ?? 0 },
  };
}

async function getRun(user: string, id: string) {
  const s = await one(
    "SELECT * FROM learning_sessions WHERE id=? AND user_id=?",
    id,
    user,
  );
  if (!s || s.status === "cancelled")
    throw new PlatformError("Тест не знайдено", 404);
  return s;
}
async function items(id: string) {
  return rows(
    "SELECT * FROM session_items WHERE session_id=? ORDER BY position",
    id,
  );
}

async function complete(s: Row) {
  const list = await items(s.id);
  const config = parse(s.config_json);
  const result: Row = {
    subjects: [],
    earned: 0,
    maximum: 0,
    count: list.length,
  };
  const statements = [];
  const db = getDatabase();
  for (const subject of config.subjects) {
    const entries = list.filter((i) => i.subject_slug === subject.slug);
    let earned = 0,
      maximum = 0;
    for (const item of entries) {
      const q = parse(item.snapshot_json);
      const score = pointsFor(q.question_type, item.answer, q.correct_answer);
      earned += score.earned;
      maximum += score.max;
      statements.push(
        db
          .prepare(
            `UPDATE session_items SET points=? WHERE session_id=? AND question_id=? AND EXISTS(SELECT 1 FROM learning_sessions WHERE id=? AND status!='completed' AND revision=?)`,
          )
          .bind(score.earned, s.id, item.question_id, s.id, s.revision),
      );
    }
    result.subjects.push({
      slug: subject.slug,
      name: subject.name,
      earned,
      maximum,
      score: s.mode === "simulation" ? (subject.scale[earned] ?? null) : null,
    });
    result.earned += earned;
    result.maximum += maximum;
  }
  statements.push(
    db
      .prepare(
        `UPDATE learning_sessions SET status='completed',result_json=?,completed_at=?,deadline=NULL,revision=revision+1 WHERE id=? AND revision=? AND status!='completed'`,
      )
      .bind(JSON.stringify(result), new Date().toISOString(), s.id, s.revision),
  );
  await db.batch(statements);
}

async function settle(s: Row) {
  if (s.status === "active" && s.deadline && now() >= s.deadline) {
    if (s.stage === 1) {
      await getDatabase()
        .prepare(
          `UPDATE learning_sessions SET status='break',break_until=?,deadline=NULL,revision=revision+1 WHERE id=? AND revision=?`,
        )
        .bind(s.deadline + parse(s.config_json).breakSeconds, s.id, s.revision)
        .run();
    } else await complete(s);
    return (await one("SELECT * FROM learning_sessions WHERE id=?", s.id))!;
  }
  return s;
}

export async function session(user: string, id: string) {
  const s = await settle(await getRun(user, id));
  const list = await items(id);
  const config = parse(s.config_json);
  return {
    ...s,
    user_id: undefined,
    config_json: undefined,
    result_json: undefined,
    config: {
      ...config,
      subjects: config.subjects.map((v: Row) => ({ ...v, scale: undefined })),
    },
    result: s.result_json ? parse(s.result_json) : null,
    serverNow: now(),
    items: list
      .filter((i) => s.status === "completed" || i.stage === s.stage)
      .map((i) => {
        const q = parse(i.snapshot_json);
        const visible = s.status === "completed" || Boolean(i.revealed);
        return {
          ...i,
          snapshot_json: undefined,
          canonical_key: undefined,
          question: q.prompt,
          type: q.question_type,
          format: q.exam_format,
          options: parse(q.options_json),
          images: parse(q.images_json),
          topic: q.topic_name,
          sourceKind: q.source_kind,
          attribution: q.attribution,
          source: q.source_url,
          correctAnswer: visible ? q.correct_answer : undefined,
          explanation: visible ? q.explanation : undefined,
          points: visible
            ? pointsFor(q.question_type, i.answer, q.correct_answer).earned
            : undefined,
        };
      }),
  };
}

export async function start(user: string, p: Row) {
  const db = getDatabase();
  const cat = await catalog();
  const simulation = p.mode === "simulation";
  if (!simulation && p.mode !== "practice")
    throw new PlatformError("Невідомий режим");
  const existing = await one(
    `SELECT id FROM learning_sessions WHERE user_id=? AND status IN ('active','break') LIMIT 1`,
    user,
  );
  if (existing) return session(user, existing.id);
  if (
    simulation &&
    !["english", "german", "biology", "geography"].includes(p.fourthSubject)
  )
    throw new PlatformError("Обери четвертий предмет");
  const slugs = simulation
    ? ["ukrainian", "mathematics", "history", p.fourthSubject]
    : [p.subject];
  const selected = slugs.map((slug) => cat.find((s) => s.slug === slug));
  if (selected.some((s) => !s)) throw new PlatformError("Предмет не знайдено");
  let list: Row[] = [];
  for (const subject of selected) {
    if (simulation) {
      const variants = await rows(
        `SELECT q.year,q.session,COUNT(q.id) count, (SELECT COUNT(*) FROM session_items i JOIN learning_sessions l ON l.id=i.session_id JOIN questions prev ON prev.id=i.question_id WHERE l.user_id=? AND prev.subject_slug=q.subject_slug AND prev.year=q.year AND prev.session=q.session) exposure FROM questions q WHERE q.subject_slug=? AND q.source_kind='official' AND q.active=1 GROUP BY q.year,q.session HAVING COUNT(*)=? ORDER BY exposure,RANDOM()`,
        user,
        subject!.slug,
        subject!.config.count,
      );
      if (!variants.length)
        throw new PlatformError(`Немає повного варіанта: ${subject!.name}`);
      const variant = variants[0];
      const questions = await rows(
        `SELECT q.*,t.name topic_name FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_slug=? AND q.year=? AND q.session=? AND q.source_kind='official' AND q.active=1 ORDER BY q.position`,
        subject!.slug,
        variant.year,
        variant.session,
      );
      const formats = subject!.config.formats as [string, number][];
      if (
        formats.some(
          ([type, count]) =>
            questions.filter((q) => q.exam_format === type).length !== count,
        ) ||
        questions.reduce(
          (sum, q) =>
            sum + pointsFor(q.question_type, "", q.correct_answer).max,
          0,
        ) !== subject!.config.max
      )
        throw new PlatformError("Варіант не відповідає специфікації НМТ");
      list.push(...questions);
    } else {
      const count = Number(p.count);
      if (!Number.isInteger(count) || count < 1 || count > 100)
        throw new PlatformError("Від 1 до 100 запитань");
      list = await rows(
        `SELECT q.*,t.name topic_name,(SELECT COUNT(*) FROM session_items i JOIN learning_sessions s ON s.id=i.session_id WHERE s.user_id=? AND i.canonical_key=q.canonical_key) exposure FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_slug=? AND q.active=1 AND (?='' OR t.section_name=?) AND (?=0 OR t.id=?) ORDER BY exposure,RANDOM() LIMIT ?`,
        user,
        subject!.slug,
        p.section ?? "",
        p.section ?? "",
        Number(p.topicId) || 0,
        Number(p.topicId) || 0,
        count,
      );
      list = [...new Map(list.map((q) => [q.canonical_key, q])).values()];
      if (!list.length)
        throw new PlatformError(
          "У цій темі ще немає завдань. Обери іншу тему.",
        );
    }
  }
  const id = crypto.randomUUID();
  const subjects = [];
  for (const subject of selected) {
    const scale = await one(
      "SELECT scale_json FROM exam_configs WHERE subject_slug=?",
      subject!.slug,
    );
    subjects.push({
      slug: subject!.slug,
      name: subject!.name,
      ...subject!.config,
      scale: parse(scale!.scale_json),
    });
  }
  const config = {
    subjects,
    stageSeconds: subjects[0].stageSeconds,
    breakSeconds: subjects[0].breakSeconds,
    requestedCount: p.count ?? list.length,
  };
  const title = simulation ? "Симуляція НМТ" : selected[0]!.name;
  const stmts = [
    db
      .prepare(
        `INSERT INTO learning_sessions(id,user_id,mode,title,config_json,deadline) VALUES(?,?,?,?,?,?)`,
      )
      .bind(
        id,
        user,
        simulation ? "simulation" : "practice",
        title,
        JSON.stringify(config),
        simulation ? now() + config.stageSeconds : null,
      ),
  ];
  list.forEach((q, position) =>
    stmts.push(
      db
        .prepare(
          `INSERT INTO session_items(session_id,question_id,subject_slug,topic_id,canonical_key,stage,position,snapshot_json,max_points) VALUES(?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          id,
          q.id,
          q.subject_slug,
          q.topic_id,
          q.canonical_key,
          simulation
            ? selected.find((s) => s!.slug === q.subject_slug)!.config.stage
            : 1,
          position,
          JSON.stringify(q),
          pointsFor(q.question_type, "", q.correct_answer).max,
        ),
    ),
  );
  await db.batch(stmts);
  return session(user, id);
}

function validAnswer(q: Row, answer: string) {
  if (answer.length > 100) return false;
  if (!answer) return true;
  const groups = parse(q.options_json);
  const options = groups
    .flatMap((g: Row) => g.options)
    .map((o: Row) => normalizeAnswer(o.marker));
  const parts = answer.split(";").map(normalizeAnswer);
  if (q.question_type === "numeric")
    return /^[-+]?\d+(?:[.,]\d+)?$/.test(answer.trim());
  if (q.question_type === "matching")
    return (
      parts.length <= groups[0].options.length &&
      new Set(parts.map((v) => v[0])).size === parts.length &&
      new Set(parts.map((v) => v.slice(1))).size === parts.length &&
      parts.every(
        (v) =>
          groups[0].options.some(
            (o: Row) => normalizeAnswer(o.marker) === v[0],
          ) &&
          groups[1].options.some(
            (o: Row) => normalizeAnswer(o.marker) === v.slice(1),
          ),
      )
    );
  if (q.question_type === "type_6")
    return (
      parts.length <= groups.length &&
      parts.every(
        (v, i) =>
          !v ||
          groups[i].options.some((o: Row) => normalizeAnswer(o.marker) === v),
      )
    );
  if (q.question_type === "ordering")
    return (
      parts.length <= options.length &&
      new Set(parts.filter(Boolean)).size === parts.filter(Boolean).length &&
      parts.every((v) => !v || options.includes(v))
    );
  if (q.question_type === "multiple_choice")
    return (
      parts.length <= 3 &&
      new Set(parts).size === parts.length &&
      parts.every((v) => options.includes(v))
    );
  return parts.length === 1 && options.includes(parts[0]);
}

export async function act(user: string, p: Row) {
  if (p.action === "start") return start(user, p);
  let s = await settle(await getRun(user, String(p.id)));
  if (s.status === "completed") return session(user, s.id);
  const db = getDatabase();
  if (p.action === "cancel") {
    await db
      .prepare(
        `UPDATE learning_sessions SET status='cancelled',deadline=NULL,break_until=NULL,revision=revision+1 WHERE id=? AND user_id=? AND status IN ('active','break')`,
      )
      .bind(s.id, user)
      .run();
    return { id: s.id, cancelled: true };
  }
  if (Number(p.revision) !== s.revision)
    throw new PlatformError(
      "Тест оновлено в іншій вкладці. Онови сторінку.",
      409,
    );
  if (p.action === "continue") {
    if (s.status !== "break")
      throw new PlatformError("Другий етап ще недоступний");
    await db
      .prepare(
        `UPDATE learning_sessions SET status='active',stage=2,deadline=?,break_until=NULL,current_index=0,revision=revision+1 WHERE id=? AND revision=?`,
      )
      .bind(now() + parse(s.config_json).stageSeconds, s.id, s.revision)
      .run();
  } else if (p.action === "finish") {
    if (s.status !== "active") throw new PlatformError("Тест на перерві");
    if (s.mode === "simulation" && s.stage === 1)
      await db
        .prepare(
          `UPDATE learning_sessions SET status='break',break_until=?,deadline=NULL,revision=revision+1 WHERE id=? AND revision=?`,
        )
        .bind(now() + parse(s.config_json).breakSeconds, s.id, s.revision)
        .run();
    else await complete(s);
  } else if (["save", "reveal", "flag", "navigate"].includes(p.action)) {
    if (s.status !== "active")
      throw new PlatformError("Відповіді недоступні під час перерви");
    const item = await one(
      "SELECT * FROM session_items WHERE session_id=? AND question_id=? AND stage=?",
      s.id,
      String(p.questionId),
      s.stage,
    );
    if (!item) throw new PlatformError("Завдання не належить поточному етапу");
    if (p.action === "navigate") {
      await db
        .prepare(
          "UPDATE learning_sessions SET current_index=?,revision=revision+1 WHERE id=? AND revision=?",
        )
        .bind(item.position, s.id, s.revision)
        .run();
      return session(user, s.id);
    }
    const q = parse(item.snapshot_json);
    if (p.action === "reveal" && s.mode === "simulation")
      throw new PlatformError(
        "У симуляції відповіді доступні лише після завершення",
      );
    if (
      p.action === "save" &&
      (item.revealed || !validAnswer(q, String(p.answer ?? "")))
    )
      throw new PlatformError(
        item.revealed
          ? "Перевірену відповідь змінювати не можна"
          : "Перевір формат відповіді та повтори у вибраних варіантах",
      );
    const field =
      p.action === "save"
        ? "answer"
        : p.action === "reveal"
          ? "revealed"
          : "flagged";
    const value =
      p.action === "save"
        ? String(p.answer ?? "")
        : p.action === "reveal"
          ? 1
          : Number(!item.flagged);
    await db.batch([
      db
        .prepare(
          `UPDATE session_items SET ${field}=? WHERE session_id=? AND question_id=? AND EXISTS(SELECT 1 FROM learning_sessions WHERE id=? AND revision=?)`,
        )
        .bind(value, s.id, item.question_id, s.id, s.revision),
      db
        .prepare(
          "UPDATE learning_sessions SET revision=revision+1,current_index=? WHERE id=? AND revision=?",
        )
        .bind(item.position, s.id, s.revision),
    ]);
  } else throw new PlatformError("Невідома дія");
  return session(user, s.id);
}
