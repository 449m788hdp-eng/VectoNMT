import { getCurrentUser } from "@/lib/current-user";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

function dateOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return kyivDate(date);
}

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const db = getDatabase();
    const profile = await db.prepare("SELECT display_name, first_name, last_name, grade, fourth_subject, subject_targets_json, target_score, created_at FROM profiles WHERE user_id = ?1").bind(identity.userId).first<{ display_name: string; first_name: string; last_name: string; grade: string; fourth_subject: string; subject_targets_json: string; target_score: number; created_at: string }>();
    if (!profile) return Response.json({ needsOnboarding: true }, noStore(409));
    await db.prepare("INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)").bind(identity.userId, kyivDate()).run();

    const [summary, subjectRows, dayRows, recentRows] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS completed, ROUND(AVG(score)) AS average_score FROM test_attempts WHERE user_id = ?1 AND completed_at IS NOT NULL").bind(identity.userId).first<{ completed: number; average_score: number | null }>(),
      db.prepare(`SELECT s.slug, s.name, COUNT(a.id) AS tests, ROUND(AVG(a.correct_answers * 100.0 / a.total_questions)) AS accuracy
        FROM subjects s LEFT JOIN test_attempts a ON a.subject_slug=s.slug AND a.user_id=?1 AND a.completed_at IS NOT NULL
        GROUP BY s.slug, s.name ORDER BY s.position`).bind(identity.userId).all<{ slug: string; name: string; tests: number; accuracy: number | null }>(),
      db.prepare("SELECT study_date FROM study_days WHERE user_id = ?1 AND study_date >= ?2 ORDER BY study_date DESC").bind(identity.userId, dateOffset(-30)).all<{ study_date: string }>(),
      db.prepare(`SELECT a.id, a.subject_slug, s.name AS subject_name, a.score, a.correct_answers, a.total_questions, a.completed_at
        FROM test_attempts a JOIN subjects s ON s.slug=a.subject_slug
        WHERE a.user_id=?1 AND a.completed_at IS NOT NULL ORDER BY a.completed_at DESC LIMIT 20`).bind(identity.userId).all(),
    ]);

    const activeDays = new Set(dayRows.results.map((row) => row.study_date));
    let streak = 0;
    for (let offset = 0; offset > -31; offset -= 1) {
      if (!activeDays.has(dateOffset(offset))) break;
      streak += 1;
    }
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = dateOffset(index - 6);
      return { date, active: activeDays.has(date) };
    });

    return Response.json({
      profile: {
        displayName: profile.display_name,
        firstName: profile.first_name || profile.display_name.split(/\s+/)[0] || "Учень",
        lastName: profile.last_name || profile.display_name.split(/\s+/).slice(1).join(" "),
        grade: profile.grade || "11",
        fourthSubject: profile.fourth_subject || "english",
        subjectTargets: (() => { try { return JSON.parse(profile.subject_targets_json || "{}"); } catch { return {}; } })(),
        targetScore: profile.target_score,
        createdAt: profile.created_at,
      },
      stats: { completedTests: summary?.completed ?? 0, averageScore: summary?.average_score, streak },
      subjects: subjectRows.results,
      weeklyActivity,
      recentAttempts: recentRows.results,
    }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося завантажити статистику" }, noStore(500));
  }
}
