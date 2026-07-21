import { describe, expect, it } from "vitest";
import { assistantAnswerSchema, askQuestionSchema, insuranceExtractionSchema } from "@/modules/ai/schemas";

describe("AI structured output validation", () => {
  it("accepts a bounded reviewed extraction", () => {
    expect(insuranceExtractionSchema.safeParse({
      documentType: "AUTO_INSURANCE", title: "Demo auto plan",
      fields: [{ key: "provider", label: "Provider", value: "Synthetic Mutual", confidence: 0.9 }],
      effectiveDate: null, expirationDate: "2027-01-01", recommendedVisibility: "INNER",
      recommendationReason: "Drivers may need it.", overallConfidence: 0.9, uncertainties: [],
    }).success).toBe(true);
  });

  it("rejects invalid confidence and access values", () => {
    expect(insuranceExtractionSchema.safeParse({
      documentType: "AUTO_INSURANCE", title: "Demo", fields: [], effectiveDate: null,
      expirationDate: null, recommendedVisibility: "EVERYONE", recommendationReason: "No.",
      overallConfidence: 4, uncertainties: [],
    }).success).toBe(false);
  });

  it("accepts a grounded answer and rejects citations on an unanswerable result", () => {
    expect(assistantAnswerSchema.safeParse({
      answerable: true,
      answer: "Call the synthetic roadside provider.",
      citations: [{ sourceId: "S1", resourcePublicId: "roadside-assistance", reason: null }],
      confidence: "high",
    }).success).toBe(true);
    expect(assistantAnswerSchema.safeParse({
      answerable: false,
      answer: "No answer.",
      citations: [{ sourceId: "S1", resourcePublicId: "roadside-assistance", reason: null }],
      confidence: "low",
    }).success).toBe(false);
  });

  it("rejects unsupported Ask payload properties and oversized questions", () => {
    expect(askQuestionSchema.safeParse({ question: "Where is it?", memberId: "member_alex" }).success).toBe(false);
    expect(askQuestionSchema.safeParse({ question: "x".repeat(501) }).success).toBe(false);
  });
});
