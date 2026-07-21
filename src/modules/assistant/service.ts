import { randomUUID } from "node:crypto";
import type { AiGatewayPort, AiRunMetadata } from "@/modules/ai/ports";
import { assistantAnswerSchema, askQuestionSchema, type AssistantAnswer } from "@/modules/ai/schemas";
import { AiCircuitOpenError, AiRuntimeExecutionError, safeAiErrorCategory } from "@/modules/ai/runtime";
import { buildEvidencePacket } from "@/modules/assistant/evidence";
import {
  ASK_NO_ANSWER_MESSAGE,
  ASK_UNAVAILABLE_MESSAGE,
  type AiRunRepositoryPort,
  type AskCitationDto,
  type AskPrivatoResponseDto,
  type AskProtectionTraceDto,
  type AuditEventPort,
  type AuthorizedResourceRepositoryPort,
  type AuthorizedRetrieverPort,
  type EvidencePacket,
  type ResourceEncryptionPort,
} from "@/modules/assistant/types";
import { assertResourceAccess, AuthorizationError } from "@/modules/authorization/policy";
import type { SessionPrincipal } from "@/modules/core/domain";

const MAX_CANDIDATES = 3;
const MAX_EVIDENCE_CHARACTERS = 12_000;

export class AiOutputValidationError extends Error {
  constructor() {
    super("The AI result failed validation.");
    this.name = "AiOutputValidationError";
  }
}

interface AskPrivatoDependencies {
  repository: AuthorizedResourceRepositoryPort;
  retriever: AuthorizedRetrieverPort;
  encryption: ResourceEncryptionPort;
  gateway?: AiGatewayPort;
  aiRuns: AiRunRepositoryPort;
  audit: AuditEventPort;
  configuredModel?: string;
  now?: () => number;
}

interface ExecutionState {
  authorizedResourceCount: number;
  candidateCount: number;
  sourceCount: number;
  answerable: boolean;
  answerModelInvoked: boolean;
  model?: string;
  retryCount: number;
  circuitState: "closed" | "open" | "half-open";
  inputTokens?: number;
  outputTokens?: number;
  outcome: "SUCCESS" | "NO_EVIDENCE" | "UNAVAILABLE";
  errorCategory?: string;
}

function circleLabel(circle: SessionPrincipal["circle"]): string {
  return `${circle[0]}${circle.slice(1).toLowerCase()}`;
}

function displayCircuitState(state: ExecutionState["circuitState"]): AskProtectionTraceDto["circuitState"] {
  if (state === "half-open") return "Half-open";
  return state === "open" ? "Open" : "Closed";
}

function traceFor(
  principal: SessionPrincipal,
  correlationId: string,
  durationMs: number,
  state: ExecutionState,
  policyDecision: AskProtectionTraceDto["policyDecision"],
): AskProtectionTraceDto {
  return {
    viewingAs: principal.displayName,
    circle: circleLabel(principal.circle),
    authorizedResourceCount: state.authorizedResourceCount,
    candidatesConsidered: state.candidateCount,
    sourcesUsed: state.sourceCount,
    policyDecision,
    retrievalMethod: "Structured + lexical",
    answerModelInvoked: state.answerModelInvoked,
    model: state.answerModelInvoked ? state.model : undefined,
    durationMs,
    retryCount: state.retryCount,
    circuitState: displayCircuitState(state.circuitState),
    inputTokens: state.inputTokens,
    outputTokens: state.outputTokens,
    correlationId: correlationId.slice(0, 8),
  };
}

function mergeMetadata(state: ExecutionState, metadata: AiRunMetadata, correctionAttempt: number): void {
  state.model = metadata.model;
  state.retryCount += metadata.retryCount + correctionAttempt;
  state.circuitState = metadata.circuitState;
  state.inputTokens = (state.inputTokens ?? 0) + (metadata.tokenUsage.input ?? 0);
  state.outputTokens = (state.outputTokens ?? 0) + (metadata.tokenUsage.output ?? 0);
}

export class AskPrivatoService {
  private readonly now: () => number;

  constructor(private readonly dependencies: AskPrivatoDependencies) {
    this.now = dependencies.now ?? Date.now;
  }

  async execute(input: {
    principal: SessionPrincipal;
    question: string;
    correlationId?: string;
  }): Promise<AskPrivatoResponseDto> {
    const question = askQuestionSchema.parse({ question: input.question }).question;
    const correlationId = input.correlationId ?? randomUUID();
    const startedAt = this.now();
    const state: ExecutionState = {
      authorizedResourceCount: 0,
      candidateCount: 0,
      sourceCount: 0,
      answerable: false,
      answerModelInvoked: false,
      model: this.dependencies.configuredModel,
      retryCount: 0,
      circuitState: "closed",
      outcome: "NO_EVIDENCE",
    };

    try {
      const authorizedResourceIds = [...new Set(
        await this.dependencies.repository.listAuthorizedResourceIds(input.principal),
      )];
      state.authorizedResourceCount = authorizedResourceIds.length;
      const authorizedSet = new Set(authorizedResourceIds);

      const retrieval = await this.dependencies.retriever.search({
        principal: input.principal,
        authorizedResourceIds,
        question,
        limit: MAX_CANDIDATES,
      });
      state.candidateCount = retrieval.candidates.length;

      if (retrieval.candidates.some((candidate) => (
        candidate.householdId !== input.principal.householdId
        || !authorizedSet.has(candidate.resourcePublicId)
      ))) throw new AiOutputValidationError();

      if (retrieval.candidates.length === 0) {
        const durationMs = this.now() - startedAt;
        const response: AskPrivatoResponseDto = {
          status: "no_answer",
          answer: ASK_NO_ANSWER_MESSAGE,
          citations: [],
          trace: traceFor(input.principal, correlationId, durationMs, state, "No authorized evidence"),
        };
        await this.record(input.principal, correlationId, durationMs, state);
        return response;
      }

      const evidencePackets: EvidencePacket[] = [];
      for (const [index, candidate] of retrieval.candidates.entries()) {
        const resource = await this.dependencies.repository.findAuthorizedByPublicId(
          input.principal,
          candidate.resourcePublicId,
        );
        if (!resource || resource.householdId !== input.principal.householdId) {
          throw new AiOutputValidationError();
        }
        assertResourceAccess(input.principal, resource);
        const fields = await this.dependencies.encryption.readAuthorizedFields(input.principal, resource);
        const packet = buildEvidencePacket({
          sourceId: `S${index + 1}`,
          question,
          candidate,
          resource,
          fields,
        });
        const proposed = [...evidencePackets, packet];
        if (JSON.stringify(proposed).length > MAX_EVIDENCE_CHARACTERS) break;
        evidencePackets.push(packet);
      }

      if (evidencePackets.length === 0) throw new AiOutputValidationError();
      if (!this.dependencies.gateway) {
        state.outcome = "UNAVAILABLE";
        state.errorCategory = "provider_not_configured";
        const durationMs = this.now() - startedAt;
        const response: AskPrivatoResponseDto = {
          status: "unavailable",
          answer: ASK_UNAVAILABLE_MESSAGE,
          citations: [],
          trace: traceFor(input.principal, correlationId, durationMs, state, "Unavailable"),
        };
        await this.record(input.principal, correlationId, durationMs, state);
        return response;
      }

      let lastValidationError: unknown;
      for (let correctionAttempt = 0; correctionAttempt <= 1; correctionAttempt += 1) {
        try {
          await this.assertEvidenceStillAuthorized(input.principal, evidencePackets);
          state.answerModelInvoked = true;
          const result = await this.dependencies.gateway.answerAuthorizedQuestion({
            question,
            evidencePackets,
            correlationId,
            correctionAttempt,
          });
          mergeMetadata(state, result.metadata, correctionAttempt);
          const parsed = assistantAnswerSchema.parse(result.data);
          const citations = await this.validateCitations(input.principal, parsed, evidencePackets);

          if (!parsed.answerable) {
            state.outcome = "SUCCESS";
            const durationMs = this.now() - startedAt;
            const response: AskPrivatoResponseDto = {
              status: "no_answer",
              answer: ASK_NO_ANSWER_MESSAGE,
              citations: [],
              trace: traceFor(input.principal, correlationId, durationMs, state, "Insufficient evidence"),
            };
            await this.record(input.principal, correlationId, durationMs, state);
            return response;
          }

          state.answerable = true;
          state.sourceCount = citations.length;
          state.outcome = "SUCCESS";
          const durationMs = this.now() - startedAt;
          const response: AskPrivatoResponseDto = {
            status: "answered",
            answer: parsed.answer,
            citations,
            trace: traceFor(input.principal, correlationId, durationMs, state, "Allowed"),
          };
          await this.record(input.principal, correlationId, durationMs, state);
          return response;
        } catch (error) {
          if (error instanceof AiOutputValidationError || (error instanceof Error && (error.name === "ZodError" || error.name === "AiOutputValidationError"))) {
            lastValidationError = error;
            if (correctionAttempt === 0) continue;
          }
          throw error;
        }
      }

      throw lastValidationError ?? new AiOutputValidationError();
    } catch (error) {
      state.outcome = "UNAVAILABLE";
      state.errorCategory = safeAiErrorCategory(error);
      if (error instanceof AiRuntimeExecutionError) {
        state.retryCount += error.retryCount;
        state.circuitState = error.circuitState;
      }
      if (error instanceof AiCircuitOpenError) {
        state.answerModelInvoked = false;
        state.circuitState = "open";
      }
      const durationMs = this.now() - startedAt;
      const response: AskPrivatoResponseDto = {
        status: "unavailable",
        answer: ASK_UNAVAILABLE_MESSAGE,
        citations: [],
        trace: traceFor(input.principal, correlationId, durationMs, state, "Unavailable"),
      };
      await this.record(input.principal, correlationId, durationMs, state);
      return response;
    }
  }

  private async validateCitations(
    principal: SessionPrincipal,
    answer: AssistantAnswer,
    evidencePackets: EvidencePacket[],
  ): Promise<AskCitationDto[]> {
    if (!answer.answerable) {
      if (answer.citations.length > 0) throw new AiOutputValidationError();
      return [];
    }

    const evidenceByPair = new Map(
      evidencePackets.map((packet) => [`${packet.sourceId}:${packet.resourcePublicId}`, packet]),
    );
    const citations: AskCitationDto[] = [];
    const seen = new Set<string>();

    for (const citation of answer.citations) {
      const key = `${citation.sourceId}:${citation.resourcePublicId}`;
      const packet = evidenceByPair.get(key);
      if (!packet) throw new AiOutputValidationError();
      const currentResource = await this.dependencies.repository.findAuthorizedByPublicId(
        principal,
        packet.resourcePublicId,
      );
      if (!currentResource) throw new AiOutputValidationError();
      assertResourceAccess(principal, currentResource);
      if (seen.has(packet.resourcePublicId)) continue;
      seen.add(packet.resourcePublicId);
      citations.push({
        resourcePublicId: packet.resourcePublicId,
        name: packet.resourceName,
        category: packet.category,
        visibility: packet.visibility,
        href: `/vault/${encodeURIComponent(packet.resourcePublicId)}`,
        reason: citation.reason ?? undefined,
      });
    }

    if (citations.length === 0) throw new AiOutputValidationError();
    return citations;
  }

  private async assertEvidenceStillAuthorized(
    principal: SessionPrincipal,
    evidencePackets: EvidencePacket[],
  ): Promise<void> {
    for (const packet of evidencePackets) {
      const currentResource = await this.dependencies.repository.findAuthorizedByPublicId(
        principal,
        packet.resourcePublicId,
      );
      if (!currentResource) throw new AuthorizationError();
      assertResourceAccess(principal, currentResource);
    }
  }

  private async record(
    principal: SessionPrincipal,
    correlationId: string,
    durationMs: number,
    state: ExecutionState,
  ): Promise<void> {
    await Promise.allSettled([
      this.dependencies.aiRuns.record({
        correlationId,
        householdId: principal.householdId,
        actorMemberId: principal.memberId,
        operation: "ASK_PRIVATO",
        retrievalMode: "structured_lexical",
        authorizedResourceCount: state.authorizedResourceCount,
        candidateCount: state.candidateCount,
        sourceCount: state.sourceCount,
        answerable: state.answerable,
        answerModelInvoked: state.answerModelInvoked,
        provider: state.answerModelInvoked ? "openai" : "none",
        model: state.model ?? "not-invoked",
        durationMs,
        retryCount: state.retryCount,
        circuitState: state.circuitState,
        inputTokens: state.inputTokens,
        outputTokens: state.outputTokens,
        outcome: state.outcome,
        errorCategory: state.errorCategory,
      }),
      this.dependencies.audit.record({
        householdId: principal.householdId,
        actorMemberId: principal.memberId,
        action: "ASSISTANT_QUERY_EXECUTED",
        outcome: state.outcome === "UNAVAILABLE" ? "FAILED" : "SUCCESS",
        summary: "Ask Privato request completed",
        safeMetadata: {
          answerable: state.answerable,
          sourceCount: state.sourceCount,
          outcome: state.outcome,
          durationBucket: durationMs < 1_000 ? "under_1s" : durationMs < 3_000 ? "1_to_3s" : "over_3s",
        },
      }),
    ]);
  }
}
