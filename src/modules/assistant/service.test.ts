import { describe, expect, it, vi } from "vitest";
import type { AiGatewayPort } from "@/modules/ai/ports";
import { DemoAiGateway } from "@/modules/ai/demo-gateway";
import { answerAuthorizedQuestion, buildAuthorizedAssistantContext } from "@/modules/assistant/service";
import type { HouseholdSnapshot, SessionPrincipal } from "@/modules/core/domain";
import { demoAuditEvents, demoMembers, demoResources, DEMO_HOUSEHOLD_ID } from "@/modules/demo/seed";

const snapshot: HouseholdSnapshot = { id: DEMO_HOUSEHOLD_ID, name: "Demo", members: demoMembers, resources: demoResources, auditEvents: demoAuditEvents };
const sam: SessionPrincipal = { householdId: DEMO_HOUSEHOLD_ID, memberId: "member_sam", displayName: "Sam Rivera", circle: "OUTER", isDemo: true };

describe("authorization-first assistant retrieval", () => {
  it("contains only resources the principal can access", () => {
    const context = buildAuthorizedAssistantContext(sam, snapshot);
    expect(context.map((resource) => resource.visibility)).toEqual(["OUTER", "OUTER"]);
    expect(context.some((resource) => resource.id === "financial-account-summary")).toBe(false);
  });

  it("passes only authorized context to the AI gateway", async () => {
    const answerAuthorizedQuestionCall = vi.fn<AiGatewayPort["answerAuthorizedQuestion"]>(async (input) => ({
      data: { answer: "Accessible answer", citationIds: input.authorizedResources.map((resource) => resource.id) },
      metadata: { correlationId: input.correlationId, operation: "answer_authorized_question", provider: "demo-fallback", model: "test", durationMs: 1, retryCount: 0, circuitState: "closed", tokenUsage: {}, outcome: "fallback" },
    }));
    const gateway: AiGatewayPort = {
      extractInsuranceDocument: vi.fn<AiGatewayPort["extractInsuranceDocument"]>(),
      answerAuthorizedQuestion: answerAuthorizedQuestionCall,
    };
    await answerAuthorizedQuestion(sam, snapshot, "What can I access?", gateway);
    const sent = answerAuthorizedQuestionCall.mock.calls[0][0].authorizedResources;
    expect(sent).toHaveLength(2);
    expect(sent.every((resource) => resource.visibility === "OUTER")).toBe(true);
  });

  it("does not acknowledge an inaccessible health resource", async () => {
    const result = await answerAuthorizedQuestion(sam, snapshot, "Where is the family health insurance information?", new DemoAiGateway());
    expect(result.data).toEqual({ answer: "I couldn’t find accessible information for that request.", citationIds: [] });
  });
});
