import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoSnapshot } from "@/modules/demo/demo-store";
import { DEMO_IDENTITY_COOKIE, demoSessionCookieOptions } from "@/modules/identity/session";

const sessionSchema = z.object({ memberId: z.string().min(1).max(80) });

export async function POST(request: Request) {
  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !getDemoSnapshot().members.some((member) => member.id === parsed.data.memberId)) {
    return NextResponse.json({ error: "Unknown demo identity." }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_IDENTITY_COOKIE, parsed.data.memberId, demoSessionCookieOptions());
  return response;
}
