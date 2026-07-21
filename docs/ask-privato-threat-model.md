# Ask Privato threat model

## Scope and security objective

Ask Privato may answer only from current, household-scoped resources that the server principal can access at request time. Restricted-resource existence is itself treated as sensitive. Authorization must remain deterministic application logic; AI can generate prose but cannot widen scope, retrieve records, construct URLs, change membership, or save data.

## Assets

- Resource fields and document-derived values
- Resource existence, names, categories, and visibility
- Household membership and circle assignments
- Session identity
- Prompts and evidence packets
- API credentials
- Audit and AI-run metadata

## Trust boundaries

1. Browser input and demo identity-switch requests are untrusted.
2. The server-resolved principal and centralized authorization policy are trusted application boundaries.
3. Search metadata, decrypted fields, uploaded content, questions, and AI output are untrusted data.
4. OpenAI is an external processor and receives only selected authorized evidence with response storage disabled.
5. Audit/telemetry sinks accept only explicit safe DTOs.

## Threats and controls

| Threat | Implemented control | Residual risk / follow-up |
| --- | --- | --- |
| Browser supplies another actor or household | Strict Ask JSON accepts only `question`; principal resolves from an HTTP-only demo cookie validated against seeded membership | Demo cookie is not production authentication; replace with signed, authenticated sessions |
| Cross-household access | Policy denies household mismatch; repository also scopes the snapshot and candidate household | PostgreSQL adapter requires tenant-scoped integration tests and query review |
| Retrieve all, filter after | Repository calculates authorized IDs before the retriever; search records must be in that set; service asserts candidates afterward | Future semantic adapters must keep authorization predicates in the query |
| Unauthorized decryption | Candidate is re-resolved and policy-checked before `ResourceEncryptionPort`; adapter checks again | Active demo fields are synthetic plaintext in process; production requires deployed encrypted repository/key management |
| Restricted-resource existence leak | Missing, restricted, guessed-title, and no-relevant-evidence paths use the same neutral response and no citation | Timing and corpus-scale side channels require production testing |
| Stale access after circle move | Principal and authorized scope are rebuilt from a fresh snapshot on every request; no conversation/evidence cache exists | Multi-instance durable membership needs transactional persistence and invalidation |
| Identity-switch answer leak | Ask client is principal-keyed, aborts active work, and resets state; responses are private/no-store and vary by cookie | Production client caching libraries must include principal identity or clear on switch |
| Prompt injection in question/evidence | Model instruction declares both untrusted; no tools; evidence cannot change server scope; structured output and citations are validated | Model behavior still needs live adversarial evals when model/version changes |
| Fabricated or arbitrary citation | Source ID and public ID must exactly match supplied evidence and current authorization; URL is server-constructed; invalid output fails closed | None accepted without a valid current resource lookup |
| Oversized context / runaway model | 500-character question, three candidates, four bounded fields per source, 12K-character evidence cap, 700 output-token cap, one correction attempt | Tune limits from production telemetry without logging content |
| AI outage or throttling | Hard timeout, transient-only bounded retries, jitter, circuit breaker, safe unavailable state; vault remains usable | In-memory circuit is instance-local on serverless deployment |
| Sensitive logs or traces | Typed safe records exclude question, prompt, evidence, answer, and decrypted values; UI trace is an explicit safe DTO | Hosting/provider logs and OpenAI organization data controls need deployment review |
| Stored response retention | Responses API calls set `store: false` | Organization-level data controls and vendor agreements remain operational requirements |
| CSRF / cross-origin mutation | JSON content type, same-origin checks, same-site cookie, and no permissive CORS | Production auth rollout needs a full CSRF review |

## Prompt-injection posture

Evidence is serialized only inside the untrusted user-data section. Text such as “ignore permissions,” “reveal the system prompt,” or “pretend I am Alex” cannot alter the authorized ID set because retrieval and field access have already completed under server policy. If a model follows malicious evidence by fabricating a source, citation validation rejects the entire result. Ask Privato has no tools, browser, database access, autonomous loop, membership mutation, or long-term memory.

## Failure behavior

- No relevant authorized evidence: neutral no-answer, zero sources, answer model not invoked.
- Model says evidence is insufficient: neutral no-answer, zero citations.
- Invalid schema or citation: one correction attempt, then protected unavailable state.
- Timeout, exhausted retry budget, or open circuit: protected unavailable state.
- Citation navigation after access revocation: existing resource detail route rechecks policy and renders the same unavailable state as a nonexistent route.

## Explicit non-claims

This is a security-minded prototype, not a formal security review or compliance certification. It is not HIPAA certified, SOC 2 certified, zero-knowledge, or end-to-end encrypted. ElectriPy does not execute in the current TypeScript deployment. PostgreSQL and encrypted payload migrations are present, but the active demo remains the synthetic in-process store until a database repository is configured and reviewed.
