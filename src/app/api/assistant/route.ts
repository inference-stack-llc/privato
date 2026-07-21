import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGateway } from "@/modules/ai/gateway";
import { answerAuthorizedQuestion } from "@/modules/assistant/service";
import { getDemoSnapshot, recordDemoAudit } from "@/modules/demo/demo-store";
import { getCurrentPrincipal } from "@/modules/identity/session";
import { listAuthorizedResources } from "@/modules/resources/service";

const questionSchema = z.object({ question: z.string().trim().min(2).max(500) });

export async function POST(request: Request) {
  const principal = await getCurrentPrincipal();
  const parsed = questionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ask a short question about your household information." }, { status: 400 });
  const snapshot = getDemoSnapshot();
  try {
    const result = await answerAuthorizedQuestion(principal, snapshot, parsed.data.question, createAiGateway());
    const authorizedById = new Map(listAuthorizedResources(principal, snapshot).map((resource) => [resource.id, resource]));
    const citations = result.data.citationIds.flatMap((id) => {
      const resource = authorizedById.get(id);
      return resource ? [{ id: resource.id, name: resource.name, visibility: resource.visibility }] : [];
    });
    recordDemoAudit({ householdId: principal.householdId, actorMemberId: principal.memberId, action: "ASSISTANT_QUERY_EXECUTED", outcome: "SUCCESS", summary: "Privato answered from authorized resources" });
    return NextResponse.json({ answer: result.data.answer, citations, provider: result.metadata.provider, correlationId: result.metadata.correlationId });
  } catch {
    const correlationId = randomUUID();
    recordDemoAudit({ householdId: principal.householdId, actorMemberId: principal.memberId, action: "ASSISTANT_QUERY_EXECUTED", outcome: "FAILED", summary: "Assistant request failed safely" });
    return NextResponse.json({ error: "The assistant is temporarily unavailable.", correlationId }, { status: 503 });
  }
}
