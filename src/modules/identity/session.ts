import "server-only";
import { cookies } from "next/headers";
import { DemoIdentityProvider } from "@/modules/identity/identity-provider";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { DEFAULT_MEMBER_ID } from "@/modules/demo/seed";
import {
  applyDemoCircleOverrides,
  decodeDemoCircleOverrides,
} from "@/modules/identity/demo-session-state";

export const DEMO_IDENTITY_COOKIE = "privato_demo_identity";
export const DEMO_CIRCLE_OVERRIDES_COOKIE = "privato_demo_circle_overrides";

export function demoSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export async function getCurrentSessionContext() {
  const cookieStore = await cookies();
  const circleOverrides = decodeDemoCircleOverrides(
    cookieStore.get(DEMO_CIRCLE_OVERRIDES_COOKIE)?.value,
  );
  const snapshot = applyDemoCircleOverrides(getDemoSnapshot(), circleOverrides);
  const provider = new DemoIdentityProvider(snapshot.members, DEFAULT_MEMBER_ID);
  const principal = provider.resolve(cookieStore.get(DEMO_IDENTITY_COOKIE)?.value);
  return { principal, snapshot, circleOverrides };
}

export async function getCurrentPrincipal() {
  return (await getCurrentSessionContext()).principal;
}
