import type { AiGatewayPort, AiResult } from "@/modules/ai/ports";
import type { AssistantAnswer, InsuranceExtraction } from "@/modules/ai/schemas";

function metadata<T>(data: T, operation: "extract_insurance" | "answer_authorized_question", correlationId: string): AiResult<T> {
  return {
    data,
    metadata: {
      correlationId,
      operation,
      provider: "demo-fallback",
      model: "privato-demo-extractor",
      durationMs: 24,
      retryCount: 0,
      circuitState: "closed",
      tokenUsage: {},
      outcome: "fallback",
    },
  };
}

export class DemoAiGateway implements AiGatewayPort {
  async extractInsuranceDocument(input: { correlationId: string }): Promise<AiResult<InsuranceExtraction>> {
    return metadata({
      documentType: "AUTO_INSURANCE",
      title: "Subaru auto insurance",
      fields: [
        { key: "provider", label: "Insurance provider", value: "Summit Mutual", confidence: 0.98 },
        { key: "namedInsured", label: "Named insured", value: "Alex Morgan", confidence: 0.96 },
        { key: "policyNumber", label: "Policy number", value: "SAM-4829-7710", confidence: 0.91 },
        { key: "coveredVehicle", label: "Covered vehicle", value: "2024 Subaru Outback", confidence: 0.95 },
        { key: "vin", label: "VIN", value: "4S4BT•••••••1842", confidence: 0.83 },
        { key: "supportPhone", label: "Support phone", value: "(555) 010-8282", confidence: 0.94 },
      ],
      effectiveDate: "2026-08-01",
      expirationDate: "2027-02-01",
      recommendedVisibility: "INNER",
      recommendationReason: "Drivers and close family may need this quickly, while it should stay outside the wider trusted circle.",
      overallConfidence: 0.93,
      uncertainties: ["The last six VIN characters were masked for review."],
    }, "extract_insurance", input.correlationId);
  }

  async answerAuthorizedQuestion(): Promise<AiResult<AssistantAnswer>> {
    throw new Error("Ask Privato requires OPENAI_API_KEY; no synthetic answer is generated.");
  }
}
