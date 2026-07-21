import { NextResponse } from "next/server";
import { z } from "zod";
import { circleTypes } from "@/modules/core/domain";
import { recordDemoAudit } from "@/modules/demo/demo-store";
import { encodeDemoCircleOverrides } from "@/modules/identity/demo-session-state";
import {
  DEMO_CIRCLE_OVERRIDES_COOKIE,
  demoSessionCookieOptions,
  getCurrentSessionContext,
} from "@/modules/identity/session";

const moveSchema = z.object({
  memberId: z.string().min(1).max(80),
  circle: z.enum(circleTypes),
}).strict();

export async function POST(request: Request) {
  const { principal, snapshot, circleOverrides } = await getCurrentSessionContext();
  if (principal.circle !== "CORE") {
    return NextResponse.json(
      { error: "Circle changes require a Core identity. Switch back to Alex or Maya and try again." },
      { status: 403 },
    );
  }
  const parsed = moveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid circle change." }, { status: 400 });
  const member = snapshot.members.find((item) => item.id === parsed.data.memberId && item.householdId === principal.householdId);
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  const nextOverrides = { ...circleOverrides, [member.id]: parsed.data.circle };
  recordDemoAudit({
    householdId: principal.householdId,
    actorMemberId: principal.memberId,
    action: "MEMBER_MOVED",
    outcome: "SUCCESS",
    summary: `${member.displayName} moved from ${member.circle.toLowerCase()} to ${parsed.data.circle.toLowerCase()}`,
  });
  const response = NextResponse.json({ ok: true, memberId: member.id, circle: parsed.data.circle });
  response.cookies.set(
    DEMO_CIRCLE_OVERRIDES_COOKIE,
    encodeDemoCircleOverrides(nextOverrides),
    demoSessionCookieOptions(),
  );
  return response;
}
