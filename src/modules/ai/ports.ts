import type { Resource } from "@/modules/core/domain";
import type { AssistantAnswer, InsuranceExtraction } from "@/modules/ai/schemas";

export interface AiRunMetadata {
  correlationId: string;
  operation: "extract_insurance" | "answer_authorized_question";
  provider: "openai" | "demo-fallback";
  model: string;
  durationMs: number;
  retryCount: number;
  circuitState: "closed" | "open" | "half-open";
  tokenUsage: { input?: number; output?: number };
  outcome: "success" | "fallback";
}

export interface AiResult<T> {
  data: T;
  metadata: AiRunMetadata;
}

export interface AiGatewayPort {
  extractInsuranceDocument(input: {
    bytes: Buffer;
    mimeType: string;
    filename: string;
    correlationId: string;
  }): Promise<AiResult<InsuranceExtraction>>;
  answerAuthorizedQuestion(input: {
    question: string;
    authorizedResources: Resource[];
    correlationId: string;
  }): Promise<AiResult<AssistantAnswer>>;
}
