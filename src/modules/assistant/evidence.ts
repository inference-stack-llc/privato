import type { EvidencePacket, ResourceEncryptionPort, RetrievedCandidate } from "@/modules/assistant/types";
import { queryTerms } from "@/modules/assistant/retrieval";
import { assertResourceAccess } from "@/modules/authorization/policy";
import type { Resource, SensitiveField, SessionPrincipal } from "@/modules/core/domain";

const MAX_FIELDS_PER_SOURCE = 4;
const MAX_FIELD_VALUE_LENGTH = 500;

export class DemoResourceEncryptionAdapter implements ResourceEncryptionPort {
  async readAuthorizedFields(principal: SessionPrincipal, resource: Resource): Promise<SensitiveField[]> {
    assertResourceAccess(principal, resource);
    return structuredClone(resource.fields);
  }
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

export function selectRelevantFields(question: string, fields: SensitiveField[]): SensitiveField[] {
  const terms = queryTerms(question);
  return fields
    .map((field, index) => {
      const label = normalized(field.label);
      const value = normalized(field.value);
      const score = terms.reduce((total, term) => {
        const labelMatch = label.includes(term) ? 3 : 0;
        const valueMatch = value.includes(term) ? 1 : 0;
        return total + labelMatch + valueMatch;
      }, 0);
      return { field, index, score };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, MAX_FIELDS_PER_SOURCE)
    .map(({ field }) => ({
      label: field.label.slice(0, 100),
      value: field.value.slice(0, MAX_FIELD_VALUE_LENGTH),
    }));
}

export function buildEvidencePacket(input: {
  sourceId: string;
  question: string;
  candidate: RetrievedCandidate;
  resource: Resource;
  fields: SensitiveField[];
}): EvidencePacket {
  return {
    sourceId: input.sourceId,
    resourcePublicId: input.resource.id,
    resourceName: input.resource.name.slice(0, 120),
    category: input.resource.category,
    visibility: input.resource.visibility,
    ownerDisplayName: input.candidate.ownerDisplayName.slice(0, 120),
    description: input.resource.description.slice(0, 400),
    relevantFields: selectRelevantFields(input.question, input.fields),
    expiresAt: input.resource.expiresAt,
  };
}
