import { getCurrentUser } from "@/lib/current-user";
import { normalizedParts, pointsFor } from "@/lib/nmt-scoring";
import { getDatabase, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { attemptId?: string; questionId?: string; selectedAnswer?: string };
    if (!payload.attemptId || !payload.questionId || !payload.selectedAnswer?.trim()) return Response.json({ error: "Спочатку дай відповідь" }, noStore(400));
    const db = getDatabase();
    const question = await db.prepare(`SELECT q.correct_answer, q.explanation, q.question_type
      FROM test_attempts a JOIN attempt_questions aq ON aq.attempt_id=a.id JOIN questions q ON q.id=aq.question_id
      WHERE a.id=?1 AND a.user_id=?2 AND aq.question_id=?3 AND a.completed_at IS NULL`).bind(payload.attemptId, identity.userId, payload.questionId).first<{ correct_answer: string; explanation: string; question_type: string }>();
    if (!question) return Response.json({ error: "Завдання не належить до активного тесту" }, noStore(404));
    const points = pointsFor(question.question_type, payload.selectedAnswer, question.correct_answer);
    const correctAnswer = question.question_type === "numeric" ? question.correct_answer : normalizedParts(question.correct_answer).join(";");
    return Response.json({ questionId: payload.questionId, correctAnswer, explanation: question.explanation, points: points.earned, maxPoints: points.max, isCorrect: points.earned === points.max }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося перевірити відповідь" }, noStore(500));
  }
}
