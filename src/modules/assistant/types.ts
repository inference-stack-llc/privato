import type {
  AiRunRecord,
  AuditEvent,
  Resource,
  ResourceCategory,
  SensitiveField,
  SessionPrincipal,
  Visibility,
} from "@/modules/core/domain";

export const ASK_NO_ANSWER_MESSAGE = "I couldn’t find accessible information that answers that question.";
export const ASK_UNAVAILABLE_MESSAGE = "Ask Privato is temporarily unavailable. Your protected information is still available in the vault.";
export const ASK_VALIDATION_MESSAGE = "Please enter a question about your accessible household information.";

export type RetrievalMode = "structured_lexical";

export interface AuthorizedResourceSearchRecord {
  resourcePublicId: string;
  householdId: string;
  ownerMemberId: string;
  ownerDisplayName: string;
  name: string;
  category: ResourceCategory;
  description: string;
  visibility: Visibility;
  fieldLabels: string[];
  expiresAt?: string;
}

export interface RetrievedCandidate extends AuthorizedResourceSearchRecord {
  score: number;
  matchedTerms: string[];
}

export interface EvidencePacket {
  sourceId: string;
  resourcePublicId: string;
  resourceName: string;
  category: ResourceCategory;
  visibility: Visibility;
  ownerDisplayName: string;
  description: string;
  relevantFields: SensitiveField[];
  expiresAt?: string;
}

export interface AuthorizedResourceRepositoryPort {
  listAuthorizedResourceIds(principal: SessionPrincipal): Promise<string[]>;
  listAuthorizedSearchRecords(
    principal: SessionPrincipal,
    authorizedResourceIds: readonly string[],
  ): Promise<AuthorizedResourceSearchRecord[]>;
  findAuthorizedByPublicId(principal: SessionPrincipal, resourcePublicId: string): Promise<Resource | undefined>;
}

export interface AuthorizedRetrieverPort {
  search(input: {
    principal: SessionPrincipal;
    authorizedResourceIds: readonly string[];
    question: string;
    limit: number;
  }): Promise<{ mode: RetrievalMode; candidates: RetrievedCandidate[] }>;
}

export interface ResourceEncryptionPort {
  readAuthorizedFields(
    principal: SessionPrincipal,
    resource: Resource,
  ): Promise<SensitiveField[]>;
}

export interface AiRunRepositoryPort {
  record(run: Omit<AiRunRecord, "id" | "createdAt">): Promise<void>;
}

export interface AuditEventPort {
  record(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void>;
}

export interface AskCitationDto {
  resourcePublicId: string;
  name: string;
  category: ResourceCategory;
  visibility: Visibility;
  href: string;
  reason?: string;
}

export interface AskProtectionTraceDto {
  viewingAs: string;
  circle: string;
  authorizedResourceCount: number;
  candidatesConsidered: number;
  sourcesUsed: number;
  policyDecision: "Allowed" | "No authorized evidence" | "Insufficient evidence" | "Unavailable";
  retrievalMethod: "Structured + lexical";
  answerModelInvoked: boolean;
  model?: string;
  durationMs: number;
  retryCount: number;
  circuitState: "Closed" | "Open" | "Half-open";
  inputTokens?: number;
  outputTokens?: number;
  correlationId: string;
}

export interface AskPrivatoResponseDto {
  status: "answered" | "no_answer" | "unavailable";
  answer: string;
  citations: AskCitationDto[];
  trace: AskProtectionTraceDto;
}
