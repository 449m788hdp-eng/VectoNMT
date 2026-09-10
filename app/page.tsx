import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import VektoApp from "@/app/vekto-app";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const identity = await getChatGPTUser();
  return (
    <VektoApp
      initialIdentity={identity ? { userId: identity.userId, email: identity.email } : null}
      signInPath={chatGPTSignInPath("/")}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
