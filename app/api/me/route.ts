import { getCurrentUser } from "@/lib/current-user";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

const requiredSubjects = ["ukrainian", "mathematics", "history"];
const fourthSubjects = new Set(["english", "german", "biology", "geography"]);
const cleanName = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
const safeTargets = (value: unknown, fallback: number, fourthSubject: string) =>
  Object.fromEntries(
    [...requiredSubjects, fourthSubject].map((slug) => {
      const raw =
        value && typeof value === "object"
          ? Number((value as Record<string, unknown>)[slug])
          : fallback;
      return [
        slug,
        Math.min(
          200,
          Math.max(100, Math.round(Number.isFinite(raw) ? raw : fallback)),
        ),
      ];
    }),
  );

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return Response.json({ authenticated: false }, noStore(401));
  try {
    const db = getDatabase();
    const profile = await db
      .prepare(
        "SELECT user_id, email, display_name, first_name, last_name, grade, fourth_subject, subject_targets_json, target_score, onboarding_completed, created_at FROM profiles WHERE user_id = ?1",
      )
      .bind(identity.userId)
      .first();
    return Response.json({ authenticated: true, identity, profile }, noStore());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити профіль",
      },
      noStore(500),
    );
  }
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity)
    return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      grade?: string;
      fourthSubject?: string;
      subjectTargets?: Record<string, number>;
    };
    const firstName = cleanName(payload.firstName);
    const lastName = cleanName(payload.lastName);
    const grade = ["9", "10", "11", "graduate"].includes(payload.grade ?? "")
      ? payload.grade!
      : "11";
    const fourthSubject = fourthSubjects.has(payload.fourthSubject ?? "")
      ? payload.fourthSubject!
      : "english";
    const subjectTargets = safeTargets(
      payload.subjectTargets,
      180,
      fourthSubject,
    );
    const targetSlugs = [...requiredSubjects, fourthSubject];
    const targetScore = Math.round(
      targetSlugs.reduce((sum, slug) => sum + subjectTargets[slug], 0) /
        targetSlugs.length,
    );
    const displayName = `${firstName} ${lastName}`.trim();
    if (
      firstName.length < 2 ||
      firstName.length > 40 ||
      lastName.length < 2 ||
      lastName.length > 40
    )
      return Response.json({ error: "Вкажи ім’я та прізвище" }, noStore(400));
    const db = getDatabase();
    await db.batch([
      db
        .prepare(
          `INSERT INTO profiles (user_id, email, display_name, first_name, last_name, grade, fourth_subject, subject_targets_json, target_score, onboarding_completed) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1)
        ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, first_name=excluded.first_name, last_name=excluded.last_name, grade=excluded.grade, fourth_subject=excluded.fourth_subject, subject_targets_json=excluded.subject_targets_json, target_score=excluded.target_score, onboarding_completed=1, updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(
          identity.userId,
          identity.email,
          displayName,
          firstName,
          lastName,
          grade,
          fourthSubject,
          JSON.stringify(subjectTargets),
          targetScore,
        ),
      db
        .prepare(
          "INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)",
        )
        .bind(identity.userId, kyivDate()),
    ]);
    return Response.json(
      {
        profile: {
          userId: identity.userId,
          email: identity.email,
          displayName,
          firstName,
          lastName,
          grade,
          fourthSubject,
          subjectTargets,
          targetScore,
        },
      },
      noStore(),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося зберегти профіль",
      },
      noStore(500),
    );
  }
}
