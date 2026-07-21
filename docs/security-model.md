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

`SessionPrincipal`, `IdentityProviderPort`, and `DemoIdentityProvider` isolate the presentation identity switcher. Candidate cookie values are resolved only against seeded household members. Core membership is required for the membership-change route.

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

Ask Privato receives only already-authorized resources. Citations are intersected with authorized resource IDs a second time before returning to the browser.

## Audit and telemetry

The demo records creation, view, membership, extraction, and assistant events with actor, action, result, timestamp, and a non-sensitive summary. No raw documents, policy numbers, medical values, or prompts are logged.

## Response hardening

The Next.js configuration disables the framework signature and sets content-type sniffing, frame denial, referrer, and browser permission headers. UI errors omit stack traces and sensitive internals. Custom dialogs, toasts, inline errors, and correlation IDs replace browser-native dialogs.

## Explicit non-claims

This prototype is not certified HIPAA compliant or SOC 2 compliant. It is not zero-knowledge or end-to-end encrypted. A production launch requires an independent threat model, authentication and authorization review, database adapter review, key-management design, logging review, rate limiting, dependency scanning, security testing, privacy policy, incident response, and operational controls.
