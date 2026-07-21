# Privato build plan

## Repository assessment

The repository was empty on 2026-07-21: no package manifest, source, database schema, tests, or project conventions existed. The application is therefore being built as a focused greenfield Next.js MVP.

## Delivery strategy

1. Establish a strict TypeScript Next.js App Router foundation with Privato design tokens and secure response headers.
2. Implement centralized rank-based authorization, versioned AES-256-GCM encryption, a demo identity provider, repository ports, a Drizzle PostgreSQL schema, migration, and synthetic seed content.
3. Build the complete demo experience: entry, household dashboard, circles, access preview and moves, permission-filtered vault, resource details, and identity switching.
4. Add the insurance upload/review/approve workflow behind a validated AI gateway with an explicit manual fallback.
5. Add authorization-first Ask Privato retrieval with citations and non-disclosing denial behavior.
6. Verify authorization, encryption, extraction validation, retrieval boundaries, lint, strict types, tests, and the production build.

## One-day scope decisions

- The default demo runs without external infrastructure through an in-process demo repository behind application ports. It is deliberately isolated from domain and authorization logic so the included Drizzle adapter can replace it without changing policy code.
- PostgreSQL structure, migration, and a database seed script are included, but the live golden path does not fail when a local database is unavailable.
- ElectriPy AI 0.5.0 is currently distributed as Python 3.11+, not as a TypeScript package. The TypeScript AI gateway therefore preserves an ElectriPy-compatible boundary and implements equivalent bounded timeout/retry/circuit and safe telemetry locally. A Python sidecar is intentionally excluded from the one-day critical path.
- Uploaded demo files are validated and processed in memory. The encrypted document storage port and PostgreSQL columns establish the production boundary; durable file retrieval is documented as a prototype limitation.
