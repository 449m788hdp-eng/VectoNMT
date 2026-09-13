import { getCurrentUser } from "@/lib/current-user";
import { noStore } from "@/lib/server-data";
import {
  act,
  catalog,
  overview,
  session,
  PlatformError,
} from "@/lib/learning-platform";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return Response.json({ error: "Профіль не створено" }, noStore(401));
    const id = new URL(request.url).searchParams.get("session");
    return Response.json(
      id
        ? await session(user.userId, id)
        : { subjects: await catalog(), ...(await overview(user.userId)) },
      noStore(),
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      {
        error:
          e instanceof PlatformError
            ? e.message
            : "Не вдалося завантажити дані",
      },
      noStore(e instanceof PlatformError ? e.status : 500),
    );
  }
}
export async function POST(request: Request) {
  try {
    if (
      request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      return Response.json({ error: "Недозволений запит" }, noStore(403));
    const user = await getCurrentUser();
    if (!user)
      return Response.json({ error: "Профіль не створено" }, noStore(401));
    return Response.json(
      await act(user.userId, await request.json()),
      noStore(),
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      {
        error:
          e instanceof PlatformError
            ? e.message
            : "Не вдалося зберегти дію. Спробуй ще раз.",
      },
      noStore(e instanceof PlatformError ? e.status : 500),
    );
  }
}
