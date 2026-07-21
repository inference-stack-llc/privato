# Privato

> Digital vaults organize files. Privato organizes trust.

Privato is a private information network that helps families and close friends organize essential documents, insurance cards, medical details, emergency contacts, and household instructions around the people they trust.

This repository contains a polished Build Week MVP centered on a deterministic, relationship-aware access model: Core, Inner, and Outer Circles. The golden path demonstrates that authorized information is easy to find while restricted information is unavailable through vault browsing, pasted resource URLs, and Ask Privato.

## What is included

- Calm, responsive entry page and household dashboard
- Memorable concentric trust map plus an accessible membership list
- Rank-based inherited access with an owner-only Private level
- Demo identity preview for five synthetic household members
- Permission-filtered vault, protected detail routes, masking, audience preview, and audit history
- Insurance image/PDF upload with validation, server-side AI extraction, editable review, uncertainty, visibility recommendation, and explicit approval
- Manual resource-entry fallback
- Authorization-first Ask Privato retrieval with citations and non-disclosing empty responses
- Versioned AES-256-GCM encryption boundary and PostgreSQL encrypted-payload schema
- Drizzle schema, SQL migration, and database seed
- Timeout, transient retry, circuit breaker, correlation ID, safe metadata, and local AI fallback controls
- Focused tests for authorization, decryption boundaries, encryption, structured AI output, and assistant context

## Architecture

Privato uses Next.js App Router, strict TypeScript, React server components by default, Tailwind CSS, PostgreSQL, Drizzle ORM, Zod, and the OpenAI server SDK.

The most important boundaries are kept independent:

```text
UI / route handlers
  -> application services
      -> identity provider
      -> centralized authorization policy
      -> resource / document ports
      -> AI gateway port
          -> OpenAI + bounded runtime controls
          -> deterministic demo fallback
```

The live demo defaults to an in-process synthetic repository so the judging path remains reliable without infrastructure. The included PostgreSQL schema, migration, encrypted seed, and repository boundaries establish the production persistence shape. See [architecture](docs/architecture.md) and [security model](docs/security-model.md).

## Local setup

Prerequisites:

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ only when exercising the database path

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The complete synthetic demo works without PostgreSQL or an OpenAI key. When `OPENAI_API_KEY` is absent, the same validated AI port uses a clearly labeled deterministic fallback so upload and assistant demonstrations remain available.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Database path only | PostgreSQL connection URL |
| `PRIVATO_MASTER_KEY` | Production-shaped DB path | 32-byte AES key encoded as 64 hex characters |
| `OPENAI_API_KEY` | No | Enables live server-side OpenAI extraction and answers |
| `OPENAI_MODEL` | No | Model selected by the AI provider adapter; defaults to `gpt-4.1-mini` |
| `DEMO_SESSION_SECRET` | Future persistence | Reserved for replacing the bounded demo identity cookie with a signed session |

Generate a local encryption key with `openssl rand -hex 32`. If no key is configured, the synthetic local demo uses an explicit development-only key; database deployments should always configure one.

## Database

Create the configured database, then run:

```bash
pnpm db:migrate
pnpm db:seed
```

Schema iteration commands:

```bash
pnpm db:generate
pnpm db:push
```

The seed contains only obvious fictional names, masked identifiers, `555` phone numbers, and fictional institutions.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## ElectriPy AI integration

[ElectriPy AI 0.5.0](https://www.electripy.ai/) is currently published as a Python 3.11+ package with the `electripy` import namespace, not as a supported Next.js TypeScript runtime package. Privato therefore does not fabricate an npm import.

The application isolates runtime control behind `AiGatewayPort` and a TypeScript runtime adapter implementing the relevant one-day controls: timeouts, transient-only bounded retries with jitter, a circuit breaker, safe correlation metadata, validation, and graceful fallback. That boundary can call an ElectriPy Python service later without changing authorization or application services. Raw documents, prompts, and extracted sensitive values are not emitted to telemetry.

## Honest prototype security statement

Privato is a security-minded prototype, not a production security certification. It does not claim HIPAA compliance, SOC 2 compliance, zero-knowledge encryption, or end-to-end encryption.

Implemented controls include centralized server-side authorization, cross-household denial, owner-only Private resources, direct-route rechecks, authorization before any sensitive read boundary, server-only OpenAI calls, Zod input/output validation, upload limits and type checks, safe error messages, AES-256-GCM primitives, secure response headers, non-sensitive audit events, and authorization-filtered AI context.

## Known limitations

- The default golden path uses an in-process demo repository; state resets with the server and is not suitable for multiple instances.
- Demo identity switching is explicitly a presentation feature, not production authentication.
- Uploaded document bytes are validated and processed in memory, but the infrastructure-free demo stores only protected document metadata. Durable encrypted bytes require wiring `DocumentStoragePort` to PostgreSQL or object storage.
- PostgreSQL migration and encrypted seed are included, but the default screens do not require a running database.
- The fallback extractor produces stable synthetic fields for demonstration; configure OpenAI for document-aware extraction.
- Invitations, reminders, temporary grants, recovery, billing, and real document preview/download are intentionally outside the one-day scope.

See [the five-minute demo script](docs/demo-script.md) for the intended presentation flow.
