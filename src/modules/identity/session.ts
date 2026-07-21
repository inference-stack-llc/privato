import "server-only";
import { cookies } from "next/headers";
import { DemoIdentityProvider } from "@/modules/identity/identity-provider";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { DEFAULT_MEMBER_ID } from "@/modules/demo/seed";

export const DEMO_IDENTITY_COOKIE = "privato_demo_identity";

export async function getCurrentPrincipal() {
  const cookieStore = await cookies();
  const snapshot = getDemoSnapshot();
  const provider = new DemoIdentityProvider(snapshot.members, DEFAULT_MEMBER_ID);
  return provider.resolve(cookieStore.get(DEMO_IDENTITY_COOKIE)?.value);
}
