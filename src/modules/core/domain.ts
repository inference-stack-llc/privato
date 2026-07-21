export const circleTypes = ["CORE", "INNER", "OUTER"] as const;
export type CircleType = (typeof circleTypes)[number];

export const visibilityLevels = ["PRIVATE", ...circleTypes] as const;
export type Visibility = (typeof visibilityLevels)[number];

export const resourceCategories = [
  "INSURANCE",
  "HEALTH",
  "EMERGENCY_CONTACTS",
  "VEHICLES",
  "IDENTITY",
  "FINANCIAL",
  "LEGAL",
  "HOUSEHOLD_INSTRUCTIONS",
  "OTHER",
] as const;
export type ResourceCategory = (typeof resourceCategories)[number];

export interface Member {
  id: string;
  householdId: string;
  displayName: string;
  initials: string;
  relationshipLabel: string;
  circle: CircleType;
  avatarTone: "plum" | "rose" | "sage" | "gold" | "slate";
}

export interface SensitiveField {
  label: string;
  value: string;
  mask?: boolean;
}

export interface Resource {
  id: string;
  householdId: string;
  ownerMemberId: string;
  name: string;
  category: ResourceCategory;
  description: string;
  visibility: Visibility;
  fields: SensitiveField[];
  document?: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  householdId: string;
  actorMemberId: string;
  resourceId?: string;
  action:
    | "RESOURCE_CREATED"
    | "RESOURCE_VIEWED"
    | "RESOURCE_UPDATED"
    | "VISIBILITY_CHANGED"
    | "MEMBER_MOVED"
    | "AI_EXTRACTION_REQUESTED"
    | "AI_EXTRACTION_APPROVED"
    | "AI_EXTRACTION_FAILED"
    | "ASSISTANT_QUERY_EXECUTED";
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  summary: string;
  safeMetadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface AiRunRecord {
  id: string;
  correlationId: string;
  householdId: string;
  actorMemberId: string;
  operation: "ASK_PRIVATO";
  retrievalMode: "structured_lexical";
  authorizedResourceCount: number;
  candidateCount: number;
  sourceCount: number;
  answerable: boolean;
  answerModelInvoked: boolean;
  provider: "openai" | "none";
  model: string;
  durationMs: number;
  retryCount: number;
  circuitState: "closed" | "open" | "half-open";
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: string;
  outcome: "SUCCESS" | "NO_EVIDENCE" | "UNAVAILABLE";
  errorCategory?: string;
  createdAt: string;
}

export interface SessionPrincipal {
  householdId: string;
  memberId: string;
  displayName: string;
  circle: CircleType;
  isDemo: true;
}

export interface HouseholdSnapshot {
  id: string;
  name: string;
  members: Member[];
  resources: Resource[];
  auditEvents: AuditEvent[];
  aiRuns?: AiRunRecord[];
}

export const visibilityLabels: Record<Visibility, string> = {
  PRIVATE: "Private",
  CORE: "Core circle",
  INNER: "Inner circle",
  OUTER: "Outer circle",
};

export const categoryLabels: Record<ResourceCategory, string> = {
  INSURANCE: "Insurance",
  HEALTH: "Health",
  EMERGENCY_CONTACTS: "Emergency contacts",
  VEHICLES: "Vehicles",
  IDENTITY: "Identity",
  FINANCIAL: "Financial",
  LEGAL: "Legal",
  HOUSEHOLD_INSTRUCTIONS: "Household instructions",
  OTHER: "Other",
};
