import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDatabase, kyivDate, noStore } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ authenticated: false }, noStore(401));
  try {
    const db = getDatabase();
    const profile = await db.prepare("SELECT user_id, email, display_name, target_score, created_at FROM profiles WHERE user_id = ?1").bind(identity.userId).first();
    return Response.json({ authenticated: true, identity, profile }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося завантажити профіль" }, noStore(500));
  }
}

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Потрібно увійти" }, noStore(401));
  try {
    const payload = await request.json() as { displayName?: string; targetScore?: number };
    const displayName = payload.displayName?.trim().replace(/\s+/g, " ") ?? "";
    const targetScore = Math.min(200, Math.max(100, Math.round(payload.targetScore ?? 180)));
    if (displayName.length < 2 || displayName.length > 60) return Response.json({ error: "Вкажи справжнє ім’я" }, noStore(400));
    const db = getDatabase();
    await db.batch([
      db.prepare(`INSERT INTO profiles (user_id, email, display_name, target_score) VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, target_score=excluded.target_score, updated_at=CURRENT_TIMESTAMP`).bind(identity.userId, identity.email, displayName, targetScore),
      db.prepare("INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?1, ?2)").bind(identity.userId, kyivDate()),
    ]);
    return Response.json({ profile: { userId: identity.userId, email: identity.email, displayName, targetScore } }, noStore());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не вдалося зберегти профіль" }, noStore(500));
  }
}

