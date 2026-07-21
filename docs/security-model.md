# Prototype security model

## Assets and trust boundaries

Privato treats structured resource fields, sensitive notes, insurance identifiers, and document bytes as sensitive. Browsers, uploads, AI output, and document text are untrusted inputs. Server-side identity, authorization, encryption, persistence, and AI provider code are explicit trust boundaries.

## Authorization

The policy uses a deterministic trust rank:

| Level | Rank | Non-owner access |
| --- | ---: | --- |
| Private | 0 | Never |
| Core | 1 | Core members |
| Inner | 2 | Core and Inner members |
| Outer | 3 | Core, Inner, and Outer members |

An owner always has access to their resource. Cross-household access always fails. This rule exists only in `src/modules/authorization/policy.ts` and is reused by listings, detail reads, audience previews, and assistant retrieval.

Resource-not-found and resource-not-authorized produce the same user-facing state and metadata title. The application does not reveal that a restricted record exists.

## Identity

`SessionPrincipal`, `IdentityProviderPort`, and `DemoIdentityProvider` isolate the presentation identity switcher. The browser requests a demo switch, but the HTTP-only, same-site cookie becomes the server-side source of truth and its candidate value is resolved only against seeded household members. Ask request JSON is strict and cannot supply a member, household, circle, or resource ID. Core membership is required for the membership-change route.

Ask responses are private and `no-store`, vary by cookie, and the route is always dynamic. The Ask client is keyed to the current principal and aborts/reset its single-turn state when identity changes. No authorized-resource list or answer cache survives the switch.

This is not production authentication. A production version requires signed sessions, invitations, strong account recovery, CSRF review, rate limits, and durable membership transactions.

## Encryption

`src/modules/encryption/crypto.ts` implements AES-256-GCM with:

- a 32-byte master key
- a fresh 12-byte random nonce per encryption
- authenticated ciphertext and authentication tag
- a versioned payload format
- failure on tampering

The PostgreSQL seed encrypts structured fields before inserting them. The development-only fallback key exists strictly to keep synthetic local data runnable; real deployments must set `PRIVATO_MASTER_KEY` and introduce envelope keys/KMS rotation.

The default in-process repository contains synthetic display fields in memory and source fixtures. It is not durable storage. Uploaded bytes are not retained by that repository.

## Uploads and AI

- Accepted MIME types: PDF, JPEG, PNG, and WebP
- The extension must agree with MIME type
- Maximum size: 5 MB
- Filenames are sanitized and capped
- Uploaded content is described to the model as untrusted data, never instructions
- All provider calls happen on the server
- Model output is validated with bounded Zod schemas
- Extraction cannot save automatically
- OpenAI failures return a designed manual-entry path
- Retry applies only to timeouts, connection errors, 408/409/429, and server errors
- Circuit and retry budgets are bounded

Ask Privato enforces authorization first, retrieval second, AI last:

1. Resolve the current server principal and current membership.
2. Calculate authorized resource IDs with the centralized policy.
3. Retrieve only search records in that authorized set.
4. Assert every candidate belongs to the household and authorized set.
5. Re-resolve and re-authorize each selected candidate before reading sensitive fields.
6. Build bounded, minimal evidence packets.
7. Skip answer generation when no relevant authorized evidence exists.
8. Validate the structured answer and every source/public-ID pair.
9. Recheck current authorization for every citation before returning its deterministic route.

Restricted records are neither retrieved nor sent to OpenAI. Invalid citations fail the whole answer after one bounded correction attempt; they are not silently filtered. Resource-not-found, restricted-resource guesses, exact restricted titles, and permission-override prompts produce the same neutral no-answer behavior when no accessible evidence exists.

OpenAI requests use the Responses API with Structured Outputs, bounded output, no tools, and `store: false`. Evidence and questions are explicitly treated as untrusted data. Stored commands cannot alter the server authorization set, request arbitrary tools, or construct citation links.

## Audit and telemetry

The demo records creation, view, membership, extraction, and assistant events with actor, action, result, timestamp, and a non-sensitive summary. Ask also records safe AI-run aggregates: correlation ID, retrieval mode, authorized/candidate/source counts, answerable and model-invoked flags, provider/model, duration, retry/circuit state, token counts, outcome, and safe error category. No questions, answers, raw documents, evidence, prompts, policy numbers, medical values, or decrypted fields are logged.

These records are in-memory in the active demo. The PostgreSQL `ai_runs` schema and migration define durable columns and indexes, but no durable runtime claim is made until the database adapter is active.

## Response hardening

The Next.js configuration disables the framework signature and sets content-type sniffing, frame denial, referrer, and browser permission headers. UI errors omit stack traces and sensitive internals. Custom dialogs, toasts, inline errors, and correlation IDs replace browser-native dialogs.

## Explicit non-claims

This prototype is not certified HIPAA compliant or SOC 2 compliant. It is not zero-knowledge or end-to-end encrypted. The active demo store holds synthetic plaintext fields in process; AES-256-GCM is exercised by the PostgreSQL seed and encryption boundary, not by the default screen data path. ElectriPy is not running in the TypeScript deployment. Retrieval is structured and lexical rather than semantic. A production launch requires an independent threat model, real authentication and signed sessions, CSRF review, a deployed database adapter, key-management design, logging review, distributed rate limiting, dependency scanning, security testing, privacy policy, incident response, and operational controls.
