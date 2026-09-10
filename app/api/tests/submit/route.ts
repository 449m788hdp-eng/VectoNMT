import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

const markerMap: Record<string, string> = { "а": "a", "б": "b", "в": "c", "г": "d", "д": "e" };
function normalize(value: string) {
  const clean = value.trim().toLowerCase();
  return markerMap[clean] ?? clean;
}

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { attemptId?: string; answers?: Record<string, string> };
    if (!payload.attemptId || !payload.answers) return Response.json({ error: "Неповні відповіді" }, noStore(400));
    const db = getDatabase();
    const attempt = await db.prepare("SELECT id, total_questions, completed_at FROM test_attempts WHERE id=?1 AND user_id=?2").bind(payload.attemptId, identity.userId).first<{ id: string; total_questions: number; completed_at: string | null }>();
    if (!attempt) return Response.json({ error: "Спробу не знайдено" }, noStore(404));
    if (attempt.completed_at) return Response.json({ error: "Цей тест уже завершено" }, noStore(409));
    const questions = await db.prepare(`SELECT aq.question_id, q.correct_answer FROM attempt_questions aq
      JOIN questions q ON q.id=aq.question_id WHERE aq.attempt_id=?1 ORDER BY aq.position`).bind(attempt.id).all<{ question_id: string; correct_answer: string }>();
    let correct = 0;
    const details = questions.results.map((question) => {
      const selected = payload.answers?.[question.question_id] ?? "";
      const isCorrect = normalize(selected) === normalize(question.correct_answer);
      if (isCorrect) correct += 1;
      return { questionId: question.question_id, selected, correctAnswer: question.correct_answer, isCorrect };
    });
    const score = Math.round(100 + (correct / Math.max(1, attempt.total_questions)) * 100);
    await db.batch([
      ...details.map((detail) => db.prepare(`INSERT INTO attempt_answers (attempt_id, question_id, selected_answer, is_correct) VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_answer=excluded.selected_answer, is_correct=excluded.is_correct`).bind(attempt.id, detail.questionId, detail.selected, detail.isCorrect ? 1 : 0)),
      db.prepare("UPDATE test_attempts SET completed_at=CURRENT_TIMESTAMP, correct_answers=?1, score=?2 WHERE id=?3").bind(correct, score, attempt.id),
      db.prepare("INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)").bind(identity.userId, kyivDate()),
    ]);
    return Response.json({ score, correct, total: attempt.total_questions, details }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося завершити тест" }, noStore(500));
  }
}
