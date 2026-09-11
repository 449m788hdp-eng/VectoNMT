import { getCurrentUser } from "@/lib/current-user";
import { isFullNmtAttempt, officialNmtScore, pointsFor } from "@/lib/nmt-scoring";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { attemptId?: string; answers?: Record<string, string> };
    if (!payload.attemptId || !payload.answers) return Response.json({ error: "Неповні відповіді" }, noStore(400));
    const db = getDatabase();
    const attempt = await db.prepare("SELECT id, subject_slug, total_questions, completed_at FROM test_attempts WHERE id=?1 AND user_id=?2").bind(payload.attemptId, identity.userId).first<{ id: string; subject_slug: string; total_questions: number; completed_at: string | null }>();
    if (!attempt) return Response.json({ error: "Спробу не знайдено" }, noStore(404));
    if (attempt.completed_at) return Response.json({ error: "Цей тест уже завершено" }, noStore(409));
    const questions = await db.prepare(`SELECT aq.question_id, q.correct_answer, q.question_type FROM attempt_questions aq
      JOIN questions q ON q.id=aq.question_id WHERE aq.attempt_id=?1 ORDER BY aq.position`).bind(attempt.id).all<{ question_id: string; correct_answer: string; question_type: string }>();
    let correct = 0;
    let rawScore = 0;
    let rawMax = 0;
    const details = questions.results.map((question) => {
      const selected = payload.answers?.[question.question_id] ?? "";
      const points = pointsFor(question.question_type, selected, question.correct_answer);
      const isCorrect = points.earned === points.max;
      if (isCorrect) correct += 1;
      rawScore += points.earned;
      rawMax += points.max;
      return { questionId: question.question_id, selected, correctAnswer: question.correct_answer, isCorrect, points: points.earned, maxPoints: points.max };
    });
    const isOfficialScale = isFullNmtAttempt(attempt.subject_slug, attempt.total_questions);
    const score = isOfficialScale ? officialNmtScore(attempt.subject_slug, rawScore) : Math.round(100 + (rawScore / Math.max(1, rawMax)) * 100);
    await db.batch([
      ...details.map((detail) => db.prepare(`INSERT INTO attempt_answers (attempt_id, question_id, selected_answer, is_correct) VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_answer=excluded.selected_answer, is_correct=excluded.is_correct`).bind(attempt.id, detail.questionId, detail.selected, detail.isCorrect ? 1 : 0)),
      db.prepare("UPDATE test_attempts SET completed_at=CURRENT_TIMESTAMP, correct_answers=?1, score=?2 WHERE id=?3").bind(correct, score, attempt.id),
      db.prepare("INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)").bind(identity.userId, kyivDate()),
    ]);
    return Response.json({ score, correct, total: attempt.total_questions, rawScore, rawMax, scaleKind: isOfficialScale ? "official-2026" : "practice", passed: score !== null, details }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося завершити тест" }, noStore(500));
  }
}
