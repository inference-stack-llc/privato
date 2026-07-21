import { describe, expect, it } from "vitest";
import { insuranceExtractionSchema } from "@/modules/ai/schemas";

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
});
