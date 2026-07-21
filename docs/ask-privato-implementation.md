# Ask Privato implementation plan

## Objective

Deliver a single-turn, permission-aware Ask Privato workflow that recalculates access for every request, retrieves only from the current principal's authorized resources, sends only bounded relevant evidence to the answer model, validates every citation, and fails without revealing inaccessible-resource existence.

## Current-state assessment

- The active demo runtime is the in-process synthetic store; PostgreSQL, Drizzle, and AES-256-GCM define a production-shaped persistence path but are not the default Vercel data path.
- `modules/authorization/policy.ts` is the existing centralized access rule and remains the only authorization policy.
- The active identity is resolved server-side from an HTTP-only, same-site demo cookie and validated against seeded household members. It is a demo preview mechanism, not production authentication.
- The existing assistant filters the full snapshot before the AI call, but it does not perform relevance retrieval, no-evidence short-circuiting, evidence minimization, strict citation failure, typed trace output, or durable AI-run persistence.
- The installed OpenAI SDK supports the Responses API parser and Zod Structured Outputs. Ask calls will remain server-only and use `store: false`.
- ElectriPy is not installed and its documented package is Python-only. The existing TypeScript runtime controls will be formalized behind `AiRuntimePort`; no ElectriPy execution will be claimed.

## Implementation sequence

1. **Security foundation**
   - Keep server-side principal resolution and centralized policy.
   - Add strict Ask input validation, private/no-store responses, same-origin JSON mutation checks, and identity-keyed UI reset.
   - Add an authorized repository boundary that filters by household and policy before returning retrieval records.

2. **Authorized retrieval and evidence**
   - Add bounded structured and lexical ranking over already-authorized resources.
   - Recheck policy before each selected resource crosses the sensitive-field boundary.
   - Build compact evidence packets with source IDs and question-relevant fields; skip the answer model when no relevant evidence exists.

3. **Grounded answer generation**
   - Use the OpenAI Responses API with Zod Structured Outputs, untrusted-evidence delimiters, no tools, bounded output, and `store: false`.
   - Validate schema, source IDs, public IDs, and current authorization. Permit one correction attempt for invalid model output; otherwise fail closed.
   - Do not use the deterministic demo gateway to fabricate Ask answers when OpenAI is unavailable.

4. **Runtime controls and observability**
   - Preserve timeout, transient-only retries, jitter, and circuit breaking behind `AiRuntimePort`.
   - Record safe in-memory demo AI runs and audit events without questions, prompts, evidence, answers, or decrypted values.
   - Extend the Drizzle `ai_runs` persistence shape and migration for the same non-sensitive fields.

5. **Experience and dynamic permissions**
   - Extend the existing page with active identity and circle, pending/no-answer/unavailable states, validated resource citations, and a collapsed protection trace.
   - Recalculate membership and authorized scope on every request. Remount the single-turn UI whenever identity changes.

6. **Evaluation and documentation**
   - Add deterministic tests for the Alex/Sam Outer → Inner → Outer sequence, no-model fast path, citation failure, timeout/circuit behavior, injection/leakage prompts, identity isolation, and decrypt-only-selected behavior.
   - Update architecture, security, demo, README, threat model, and eval documentation with explicit prototype and ElectriPy limitations.
   - Run lint, typecheck, tests, production build, and responsive browser verification.

## Explicit non-goals

- No vector database or embeddings in this slice; household-scale structured and lexical retrieval is the active adapter and the embedding boundary can be added later.
- No long-term conversation memory, agent loop, external search, queue, Redis, or new authentication framework.
- No compliance, zero-knowledge, PostgreSQL-runtime, or ElectriPy-runtime claims beyond what is actually active.
