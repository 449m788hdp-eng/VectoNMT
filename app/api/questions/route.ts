import { env } from "cloudflare:workers";
import { ensureSubjectSeeded, subjectCatalog } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

function database() {
  return (env as unknown as { DB?: D1Database }).DB;
}

export async function GET(request: Request) {
  const subject = new URL(request.url).searchParams.get("subject") ?? "";
  if (!subjectCatalog.has(subject)) return Response.json({ error: "Невідомий предмет" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const db = database();
  if (!db) return Response.json({ error: "База даних ще не підключена" }, { status: 503, headers: { "Cache-Control": "no-store" } });

  try {
    await ensureSubjectSeeded(db, subject);
    const rows = await db.prepare(
      `SELECT q.id, q.external_id, q.subject_slug, t.name AS topic, q.year, q.session, q.position, q.question_type, q.prompt, q.options_json, q.correct_answer, q.explanation, q.images_json, q.source_url, q.official_pdf_url, q.attribution
       FROM questions q JOIN topics t ON t.id = q.topic_id WHERE q.subject_slug = ?1 ORDER BY q.session, q.position`
    ).bind(subject).all();
    return Response.json({ subject, total: rows.results.length, questions: rows.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Помилка бази даних";
    return Response.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
