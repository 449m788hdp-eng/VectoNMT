import { bootstrapSubject } from "@/lib/platform-bootstrap";
import { noStore } from "@/lib/server-data";
import { getCurrentUser } from "@/lib/current-user";
export async function POST(request: Request) {
  if (!(await getCurrentUser()))
    return Response.json({ error: "Профіль не створено" }, noStore(401));
  try {
    const p = (await request.json()) as { subject: string };
    await bootstrapSubject(p.subject);
    return Response.json({ ready: true }, noStore());
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Не вдалося підготувати банк запитань. Онови сторінку." },
      noStore(500),
    );
  }
}
