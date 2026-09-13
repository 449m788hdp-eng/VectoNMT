import { cookies } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const identity = await getChatGPTUser();
    const cookieStore = await cookies();
    let guestId = cookieStore.get("vekto_guest_id")?.value;
    if (!identity && (!guestId || !/^[0-9a-f-]{36}$/i.test(guestId))) {
      guestId = crypto.randomUUID();
      cookieStore.set("vekto_guest_id", guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    const userId = identity?.userId ?? `guest:${guestId}`;
    const email = identity?.email ?? `${guestId}@guest.vekto`;
    const suggestedName = identity?.fullName?.trim() || "Учень";
    const db = getDatabase();
    await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO profiles (user_id, email, display_name, first_name, last_name, grade, fourth_subject, subject_targets_json, target_score, onboarding_completed) VALUES (?1, ?2, ?3, ?4, '', '11', 'english', ?5, 180, 0)",
        )
        .bind(
          userId,
          email,
          suggestedName,
          suggestedName.split(/\s+/)[0] || "Учень",
          JSON.stringify({
            mathematics: 180,
            ukrainian: 180,
            history: 180,
            english: 180,
          }),
        ),
      db
        .prepare(
          "INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)",
        )
        .bind(userId, kyivDate()),
    ]);
    return Response.json({ ready: true, isGuest: !identity }, noStore());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося створити профіль",
      },
      noStore(500),
    );
  }
}
