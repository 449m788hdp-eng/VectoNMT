import { cookies } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export type CurrentUser = { userId: string; email: string; displayName: string; isGuest: boolean };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) return { userId: chatGPTUser.userId, email: chatGPTUser.email, displayName: chatGPTUser.displayName, isGuest: false };
  const guestId = (await cookies()).get("vekto_guest_id")?.value;
  if (!guestId || !/^[0-9a-f-]{36}$/i.test(guestId)) return null;
  return { userId: `guest:${guestId}`, email: `${guestId}@guest.vekto`, displayName: "Учень", isGuest: true };
}

