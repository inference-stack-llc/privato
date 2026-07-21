import type { AiGatewayPort, AiResult } from "@/modules/ai/ports";
import type { AssistantAnswer, InsuranceExtraction } from "@/modules/ai/schemas";
import type { Resource } from "@/modules/core/domain";

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

function answerFromResources(question: string, resources: Resource[]): AssistantAnswer {
  const normalized = question.toLowerCase();
  const scopedResources = normalized.includes("health") || normalized.includes("medical")
    ? resources.filter((resource) => resource.category === "HEALTH")
    : normalized.includes("financial") || normalized.includes("account")
      ? resources.filter((resource) => resource.category === "FINANCIAL")
      : resources;
  const terms = normalized.split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const expanded = new Set(terms);
  if (normalized.includes("roadside")) ["roadside", "vehicle", "towing"].forEach((term) => expanded.add(term));
  if (normalized.includes("insurance")) ["insurance", "health", "auto", "policy"].forEach((term) => expanded.add(term));
  if (normalized.includes("emergency")) ["emergency", "contact", "plan"].forEach((term) => expanded.add(term));

  const scored = scopedResources
    .map((resource) => {
      const haystack = [resource.name, resource.description, resource.category, ...resource.fields.flatMap((field) => [field.label, field.value])].join(" ").toLowerCase();
      const score = [...expanded].reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { resource, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) {
    return { answer: "I couldn’t find accessible information for that request.", citationIds: [] };
  }

  const primary = scored[0].resource;
  const usefulFields = primary.fields.slice(0, 4).map((field) => `${field.label}: ${field.value}`).join(" · ");
  return {
    answer: `${primary.name}: ${usefulFields}`,
    citationIds: scored.map((item) => item.resource.id),
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

  async answerAuthorizedQuestion(input: { question: string; authorizedResources: Resource[]; correlationId: string }): Promise<AiResult<AssistantAnswer>> {
    return metadata(answerFromResources(input.question, input.authorizedResources), "answer_authorized_question", input.correlationId);
  }
}

export { answerFromResources };
