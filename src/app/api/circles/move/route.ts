import { NextResponse } from "next/server";
import { z } from "zod";
import { circleTypes } from "@/modules/core/domain";
import { getDemoSnapshot, moveDemoMember } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";

const moveSchema = z.object({ memberId: z.string().min(1).max(80), circle: z.enum(circleTypes) });

export async function POST(request: Request) {
  const principal = await getCurrentPrincipal();
  if (principal.circle !== "CORE") return NextResponse.json({ error: "This action is not available." }, { status: 403 });
  const parsed = moveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid circle change." }, { status: 400 });
  const member = getDemoSnapshot().members.find((item) => item.id === parsed.data.memberId && item.householdId === principal.householdId);
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  moveDemoMember(principal.memberId, member.id, parsed.data.circle);
  return NextResponse.json({ ok: true });
}
