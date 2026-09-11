import { getCurrentUser } from "@/lib/current-user";
import { ensureSubjectSeeded, officialTopicSections, subjectCatalog } from "@/lib/question-bank";
import { getDatabase, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

type QuestionRow = { id: string; topic: string; prompt: string; question_type: string; options_json: string; images_json: string; attribution: string };

async function randomQuestions(db: D1Database, subject: string, type: string, limit: number) {
  return db.prepare(`SELECT q.id, t.name AS topic, q.prompt, q.question_type, q.options_json, q.images_json, q.attribution
    FROM questions q JOIN topics t ON t.id=q.topic_id
    WHERE q.subject_slug=?1 AND q.question_type=?2 AND t.name!='Поза програмою НМТ-2026' ${type === "single_choice" ? "AND q.options_json!='[]'" : ""}
    ORDER BY RANDOM() LIMIT ?3`).bind(subject, type, limit).all<QuestionRow>();
}

async function languageMock(db: D1Database, subject: string) {
  const reading = await db.prepare(`SELECT q.id, t.name AS topic, q.prompt, q.question_type, q.options_json, q.images_json, q.attribution
    FROM questions q JOIN topics t ON t.id=q.topic_id
    WHERE q.subject_slug=?1 AND q.question_type='single_choice' AND t.name LIKE 'Читання%'
    ORDER BY RANDOM() LIMIT 16`).bind(subject).all<QuestionRow>();
  const language = await db.prepare(`SELECT q.id, t.name AS topic, q.prompt, q.question_type, q.options_json, q.images_json, q.attribution
    FROM questions q JOIN topics t ON t.id=q.topic_id
    WHERE q.subject_slug=?1 AND q.question_type='single_choice' AND t.name NOT LIKE 'Читання%'
    ORDER BY RANDOM() LIMIT 16`).bind(subject).all<QuestionRow>();
  return [...reading.results, ...language.results];
}

async function topicQuestions(db: D1Database, subject: string, topicId: number, limit: number) {
  return db.prepare(`SELECT q.id, t.name AS topic, q.prompt, q.question_type, q.options_json, q.images_json, q.attribution
    FROM questions q JOIN topics t ON t.id=q.topic_id
    WHERE q.subject_slug=?1 AND q.topic_id=?2
    ORDER BY RANDOM() LIMIT ?3`).bind(subject, topicId, limit).all<QuestionRow>();
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { subject?: string; limit?: number; topicId?: number; mode?: "quick" | "full" | "topic" };
    const subject = payload.subject ?? "";
    const catalog = subjectCatalog.get(subject);
    if (!catalog) return Response.json({ error: "Невідомий предмет" }, noStore(400));
    const mode = payload.mode === "full" ? "full" : payload.mode === "topic" ? "topic" : "quick";
    const limit = Math.min(15, Math.max(5, Math.round(payload.limit ?? 10)));
    const db = getDatabase();
    const profile = await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?1").bind(identity.userId).first();
    if (!profile) return Response.json({ error: "Спочатку заповни профіль" }, noStore(409));
    await ensureSubjectSeeded(db, subject);
    let questions: QuestionRow[] = [];
    let topicName: string | null = null;
    if (mode === "topic") {
      const topicId = Number(payload.topicId);
      const topic = await db.prepare("SELECT id, name FROM topics WHERE id=?1 AND subject_slug=?2").bind(topicId, subject).first<{ id: number; name: string }>();
      if (!topic || !(officialTopicSections[subject] ?? []).includes(topic.name)) return Response.json({ error: "Невідома тема" }, noStore(400));
      topicName = topic.name;
      questions = (await topicQuestions(db, subject, topic.id, limit)).results;
    } else if (mode === "quick") {
      questions = (await randomQuestions(db, subject, "single_choice", limit)).results;
    } else if (subject === "english" || subject === "german") {
      questions = await languageMock(db, subject);
    } else {
      for (const format of catalog.blueprint.formats) {
        const selected = await randomQuestions(db, subject, format.type, format.count);
        questions.push(...selected.results);
      }
    }
    const expected = mode === "full" ? catalog.examQuestionCount : mode === "quick" ? limit : questions.length;
    if (!questions.length || questions.length !== expected) return Response.json({ error: "Банк ще не має повного комплекту цього формату" }, noStore(503));
    const attemptId = crypto.randomUUID();
    const statements: D1PreparedStatement[] = [
      db.prepare("INSERT INTO test_attempts (id, user_id, subject_slug, total_questions) VALUES (?1, ?2, ?3, ?4)").bind(attemptId, identity.userId, subject, questions.length),
      ...questions.map((question, index) => db.prepare("INSERT INTO attempt_questions (attempt_id, question_id, position) VALUES (?1, ?2, ?3)").bind(attemptId, String(question.id), index + 1)),
    ];
    await db.batch(statements);
    return Response.json({ attemptId, subject, subjectName: catalog.name, topicName, mode, durationMinutes: mode === "full" ? catalog.blueprint.durationMinutes : null, questions }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося почати тест" }, noStore(500));
  }
}
