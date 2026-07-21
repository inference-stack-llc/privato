import type { AuthorizedResourceRepositoryPort, AuthorizedRetrieverPort } from "@/modules/assistant/types";

const STOP_WORDS = new Set([
  "a", "about", "all", "an", "and", "are", "can", "do", "for", "from", "have", "i",
  "if", "in", "is", "it", "me", "my", "of", "on", "our", "please", "the", "to", "we",
  "what", "when", "where", "which", "who", "with", "you",
]);

const ROADSIDE_TERMS = ["roadside", "assistance", "tow", "towing", "breakdown", "battery", "lockout", "motor", "club"] as const;
const PHONE_TERMS = ["phone", "number", "call", "contact", "support", "hotline"] as const;
const VEHICLE_TERMS = ["vehicle", "car", "auto", "honda", "pilot", "vin", "registration"] as const;
const INSURANCE_TERMS = ["insurance", "policy", "coverage", "covered", "plan", "insurer"] as const;
const HEALTH_TERMS = ["health", "medical", "doctor", "clinician", "prescription", "hospital"] as const;
const EMERGENCY_TERMS = ["emergency", "urgent", "meeting", "evacuation"] as const;
const EXPIRATION_TERMS = ["expire", "expires", "expiration", "renew", "renewal", "date"] as const;

const TERM_GROUPS = [ROADSIDE_TERMS, PHONE_TERMS, VEHICLE_TERMS, INSURANCE_TERMS, HEALTH_TERMS, EMERGENCY_TERMS, EXPIRATION_TERMS] as const;
const INTENT_GROUPS = [ROADSIDE_TERMS, VEHICLE_TERMS, INSURANCE_TERMS, HEALTH_TERMS, EMERGENCY_TERMS, EXPIRATION_TERMS] as const;

function normalizedText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bbreaks?\s+down\b/g, "breakdown")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function queryTerms(question: string): string[] {
  const base = new Set(normalizedText(question).split(/\s+/).filter((term) => term.length > 1 && !STOP_WORDS.has(term)));
  for (const group of TERM_GROUPS) {
    if (group.some((term) => base.has(term))) group.forEach((term) => base.add(term));
  }
  return [...base];
}

function queryIntentGroups(question: string): ReadonlyArray<readonly string[]> {
  const base = new Set(normalizedText(question).split(/\s+/));
  return INTENT_GROUPS.filter((group) => group.some((term) => base.has(term)));
}

function includesTerm(text: string, term: string): boolean {
  return (` ${text} `).includes(` ${term} `) || (term.length >= 5 && text.includes(term));
}

export class AuthorizedStructuredLexicalRetriever implements AuthorizedRetrieverPort {
  constructor(private readonly repository: AuthorizedResourceRepositoryPort) {}

  async search(input: Parameters<AuthorizedRetrieverPort["search"]>[0]) {
    const records = await this.repository.listAuthorizedSearchRecords(
      input.principal,
      input.authorizedResourceIds,
    );
    const terms = queryTerms(input.question);
    const requiredIntentGroups = queryIntentGroups(input.question);
    if (terms.length === 0) return { mode: "structured_lexical" as const, candidates: [] };

    const candidates = records.flatMap((record) => {
      const title = normalizedText(record.name);
      const description = normalizedText(record.description);
      const category = normalizedText(record.category.replaceAll("_", " "));
      const fieldLabels = normalizedText(record.fieldLabels.join(" "));
      const searchable = [title, description, category, fieldLabels, record.expiresAt ? "expiration expires renewal date" : ""].join(" ");
      const matchedTerms = new Set<string>();
      let score = 0;

      for (const term of terms) {
        if (includesTerm(title, term)) { score += 5; matchedTerms.add(term); }
        if (includesTerm(category, term)) { score += 3; matchedTerms.add(term); }
        if (includesTerm(description, term)) { score += 2; matchedTerms.add(term); }
        if (includesTerm(fieldLabels, term)) { score += 2; matchedTerms.add(term); }
      }

      const matchesRequiredIntent = requiredIntentGroups.every((group) => (
        group.some((term) => includesTerm(searchable, term))
      ));
      if (score < 6 || matchedTerms.size < 2 || !matchesRequiredIntent) return [];
      return [{ ...record, score, matchedTerms: [...matchedTerms] }];
    });

    return {
      mode: "structured_lexical" as const,
      candidates: candidates
        .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
        .slice(0, Math.max(1, Math.min(input.limit, 5))),
    };
  }
}
