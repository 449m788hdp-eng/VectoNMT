import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureSubjectSeeded, subjectCatalog } from "@/lib/question-bank";
import { getDatabase, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { subject?: string; limit?: number };
    const subject = payload.subject ?? "";
    if (!subjectCatalog.has(subject)) return Response.json({ error: "Невідомий предмет" }, noStore(400));
    const limit = Math.min(15, Math.max(5, Math.round(payload.limit ?? 10)));
    const db = getDatabase();
    const profile = await db.prepare("SELECT user_id FROM profiles WHERE user_id = ?1").bind(identity.userId).first();
    if (!profile) return Response.json({ error: "Спочатку заповни профіль" }, noStore(409));
    await ensureSubjectSeeded(db, subject);
    const result = await db.prepare(`SELECT q.id, t.name AS topic, q.prompt, q.question_type, q.options_json, q.images_json
      FROM questions q JOIN topics t ON t.id=q.topic_id
      WHERE q.subject_slug=?1 AND q.question_type='single_choice' AND q.options_json!='[]'
      ORDER BY RANDOM() LIMIT ?2`).bind(subject, limit).all();
    if (!result.results.length) return Response.json({ error: "Для предмета поки немає доступних завдань" }, noStore(404));
    const attemptId = crypto.randomUUID();
    const statements: D1PreparedStatement[] = [
      db.prepare("INSERT INTO test_attempts (id, user_id, subject_slug, total_questions) VALUES (?1, ?2, ?3, ?4)").bind(attemptId, identity.userId, subject, result.results.length),
      ...result.results.map((question, index) => db.prepare("INSERT INTO attempt_questions (attempt_id, question_id, position) VALUES (?1, ?2, ?3)").bind(attemptId, String(question.id), index + 1)),
    ];
    await db.batch(statements);
    return Response.json({ attemptId, subject, subjectName: subjectCatalog.get(subject)?.name, questions: result.results }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося почати тест" }, noStore(500));
  }
}

