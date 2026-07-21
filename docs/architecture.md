# Architecture

## Goal

Privato is a one-day, production-shaped MVP with a complete demonstration path. The architecture deliberately invests in the boundaries that protect sensitive information and avoids infrastructure that does not improve that path.

## Modules

- `app`: App Router pages and narrowly scoped route handlers
- `components`: presentation and client interaction
- `modules/identity`: session principal and demo identity provider
- `modules/authorization`: the single deterministic access policy
- `modules/resources`: authorization-sensitive resource application services
- `modules/documents`: replaceable encrypted document storage port
- `modules/encryption`: versioned AES-256-GCM implementation
- `modules/ai`: validated gateway ports, OpenAI provider, fallback, and runtime controls
- `modules/assistant`: authorization-first retrieval orchestration
- `modules/demo`: synthetic household fixture and infrastructure-free repository
- `db`: Drizzle schema, connection factory, and encrypted seed

## Request flows

### Protected resource read

```text
route
  -> resolve SessionPrincipal from DemoIdentityProvider
  -> locate non-sensitive resource index record
  -> assertResourceAccess (household + owner/rank policy)
  -> cross sensitive-read/decryption boundary
  -> render allowed resource OR identical unavailable state
```

### Insurance extraction

```text
browser upload
  -> server MIME + extension + size validation
  -> safe correlation ID and audit event
  -> AiGatewayPort
      -> OpenAI structured response OR demo fallback
      -> timeout / retry / circuit controls
  -> Zod validation
  -> editable review and visibility recommendation
  -> explicit user approval
  -> server assigns household and owner
```

The model recommends visibility but cannot save or authorize a resource.

### Ask Privato

```text
resolve principal
  -> listAuthorizedResources using centralized policy
  -> serialize only those authorized resources
  -> generate answer
  -> validate structured response
  -> intersect citations with authorized IDs again
  -> render answer and Privato citations
```

The model never receives the entire household vault and is never asked to decide access.

## Persistence strategy

The default demo repository is stored on `globalThis` so state survives App Router requests within one process. This keeps the demonstration functional without PostgreSQL and makes its reset behavior explicit.

The Drizzle schema and SQL migration define the persistence target with UUID keys, referential constraints, encrypted sensitive payload JSON, encrypted document bytes, audit events, AI run metadata, and required indexes. `src/db/seed.ts` encrypts fields before database insertion.

A production follow-up would implement the existing repository and `DocumentStoragePort` boundaries against Drizzle, then remove the demo repository from runtime composition without changing UI policy code.

## AI runtime and ElectriPy

The official ElectriPy 0.5.0 distribution is Python 3.11+. The Next.js runtime cannot import it directly. `AiGatewayPort` is therefore the stable application boundary, while `runtime.ts` supplies bounded timeout, transient retry, jitter, and circuit behavior locally. A supported ElectriPy Python service can be placed behind this port later.

Operational metadata is intentionally small: correlation ID, operation, model, provider, duration, outcome, retries, circuit state, and token counts. Sensitive request content is excluded.
