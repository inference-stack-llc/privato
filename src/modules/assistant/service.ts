import { randomUUID } from "node:crypto";
import type { AiGatewayPort, AiResult } from "@/modules/ai/ports";
import type { AssistantAnswer } from "@/modules/ai/schemas";
import type { HouseholdSnapshot, Resource, SessionPrincipal } from "@/modules/core/domain";
import { listAuthorizedResources } from "@/modules/resources/service";

export function buildAuthorizedAssistantContext(principal: SessionPrincipal, snapshot: HouseholdSnapshot): Resource[] {
  return listAuthorizedResources(principal, snapshot);
}

export async function answerAuthorizedQuestion(
  principal: SessionPrincipal,
  snapshot: HouseholdSnapshot,
  question: string,
  gateway: AiGatewayPort,
): Promise<AiResult<AssistantAnswer>> {
  const authorizedResources = buildAuthorizedAssistantContext(principal, snapshot);
  return gateway.answerAuthorizedQuestion({ question, authorizedResources, correlationId: randomUUID() });
}
