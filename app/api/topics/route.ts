import { getCurrentUser } from "@/lib/current-user";
import { ensureSubjectSeeded, MIN_TOPIC_QUESTIONS, QUESTION_BANK_SIZE, subjectCatalog, topicTaxonomy } from "@/lib/question-bank";
import { getDatabase, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  const subject = new URL(request.url).searchParams.get("subject") ?? "";
  const catalog = subjectCatalog.get(subject);
  if (!catalog) return Response.json({ error: "Невідомий предмет" }, noStore(400));
  try {
    const db = getDatabase();
    await ensureSubjectSeeded(db, subject);
    const rows = await db.prepare(`SELECT t.id, t.name, t.section_name, t.position, COUNT(q.id) AS question_count
      FROM topics t LEFT JOIN questions q ON q.topic_id=t.id AND q.subject_slug=?1
      WHERE t.subject_slug=?1 GROUP BY t.id, t.name, t.section_name, t.position ORDER BY t.position`).bind(subject).all<{ id: number; name: string; section_name: string; position: number; question_count: number }>();
    const counts = new Map(rows.results.map((row) => [row.name, row]));
    const sections = (topicTaxonomy[subject] ?? []).map((section) => ({
      name: section.name,
      questionCount: section.topics.reduce((sum, name) => sum + (counts.get(name)?.question_count ?? 0), 0),
      topics: section.topics.map((name) => ({ id: counts.get(name)?.id, name, questionCount: counts.get(name)?.question_count ?? 0 })).filter((topic) => topic.id && topic.questionCount >= MIN_TOPIC_QUESTIONS),
    })).map((section) => ({ ...section, questionCount: section.topics.reduce((sum, item) => sum + item.questionCount, 0) })).filter((section) => section.questionCount > 0);
    return Response.json({ subject, subjectName: catalog.name, bankSize: QUESTION_BANK_SIZE, minimumTopicSize: MIN_TOPIC_QUESTIONS, blueprint: catalog.blueprint, sections }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося завантажити теми" }, noStore(500));
  }
}
