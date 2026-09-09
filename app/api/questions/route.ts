import { env } from "cloudflare:workers";
import questionData from "@/data/nmt-questions.json";

type QuestionRecord = (typeof questionData.questions)[number];

const subjectCatalog = new Map([
  ["mathematics", { name: "Математика", examQuestionCount: 22, required: 1, position: 1 }],
  ["ukrainian", { name: "Українська мова", examQuestionCount: 30, required: 1, position: 2 }],
  ["english", { name: "Англійська мова", examQuestionCount: 32, required: 0, position: 3 }],
  ["history", { name: "Історія України", examQuestionCount: 30, required: 1, position: 4 }],
  ["german", { name: "Німецька мова", examQuestionCount: 32, required: 0, position: 5 }],
  ["biology", { name: "Біологія", examQuestionCount: 30, required: 0, position: 6 }],
  ["geography", { name: "Географія", examQuestionCount: 30, required: 0, position: 7 }],
]);

function database() {
  return (env as unknown as { DB?: D1Database }).DB;
}

async function seedSubject(db: D1Database, subject: string, records: QuestionRecord[]) {
  const catalog = subjectCatalog.get(subject);
  if (!catalog) return;

  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT OR IGNORE INTO subjects (slug, name, exam_question_count, required, position) VALUES (?1, ?2, ?3, ?4, ?5)").bind(subject, catalog.name, catalog.examQuestionCount, catalog.required, catalog.position),
  ];
  const topicIds = new Map<string, number>();
  for (const record of records) {
    statements.push(db.prepare("INSERT OR IGNORE INTO topics (subject_slug, name) VALUES (?1, ?2)").bind(subject, record.topic));
  }
  for (let offset = 0; offset < statements.length; offset += 50) await db.batch(statements.slice(offset, offset + 50));

  const topics = await db.prepare("SELECT id, name FROM topics WHERE subject_slug = ?1").bind(subject).all<{ id: number; name: string }>();
  for (const topic of topics.results) topicIds.set(topic.name, topic.id);

  const questionStatements = records.map((record) => db.prepare(
    `INSERT INTO questions (id, external_id, subject_slug, topic_id, year, session, position, question_type, prompt, options_json, correct_answer, explanation, images_json, source_url, official_pdf_url, attribution)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
     ON CONFLICT(id) DO UPDATE SET external_id=excluded.external_id, topic_id=excluded.topic_id, question_type=excluded.question_type, prompt=excluded.prompt, options_json=excluded.options_json, correct_answer=excluded.correct_answer, explanation=excluded.explanation, images_json=excluded.images_json, source_url=excluded.source_url, official_pdf_url=excluded.official_pdf_url, attribution=excluded.attribution`
  ).bind(record.id, record.external_id, subject, topicIds.get(record.topic), record.year, record.session, record.position, record.question_type, record.prompt, JSON.stringify(record.options), record.correct_answer, record.explanation, JSON.stringify(record.images), record.source_url, record.official_pdf_url, record.attribution));
  for (let offset = 0; offset < questionStatements.length; offset += 50) await db.batch(questionStatements.slice(offset, offset + 50));
}

export async function GET(request: Request) {
  const subject = new URL(request.url).searchParams.get("subject") ?? "";
  if (!subjectCatalog.has(subject)) return Response.json({ error: "Невідомий предмет" }, { status: 400 });
  const db = database();
  if (!db) return Response.json({ error: "База даних ще не підключена" }, { status: 503 });

  try {
    const records = questionData.questions.filter((record) => record.subject === subject);
    await seedSubject(db, subject, records);
    const rows = await db.prepare(
      `SELECT q.id, q.external_id, q.subject_slug, t.name AS topic, q.year, q.session, q.position, q.question_type, q.prompt, q.options_json, q.correct_answer, q.explanation, q.images_json, q.source_url, q.official_pdf_url, q.attribution
       FROM questions q JOIN topics t ON t.id = q.topic_id WHERE q.subject_slug = ?1 ORDER BY q.session, q.position`
    ).bind(subject).all();
    return Response.json({ subject, total: rows.results.length, questions: rows.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Помилка бази даних";
    return Response.json({ error: message }, { status: 500 });
  }
}
