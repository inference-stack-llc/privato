# Privato engineering constraints

These rules apply to future work in this repository.

## Product focus

- Privato organizes trust, not merely files.
- Preserve the five-minute golden path before adding breadth.
- The experience must communicate preparedness, privacy, calm, and precision.
- Use only synthetic data in source, tests, screenshots, and seeds.

## Security invariants

- `src/modules/authorization/policy.ts` is the single source of truth for resource access.
- Lower circle ranks are more trusted: Private 0, Core 1, Inner 2, Outer 3.
- Access is owner override OR member rank less than or equal to resource visibility rank.
- Never send unfiltered household resources to an AI provider. Identity, authorization, retrieval, then AI—in that order.
- Recheck authorization before detail reads, decryption, document access, and AI retrieval context.
- Do not trust client-provided household IDs, owner IDs, or actor IDs.
- Validate external input and AI output with Zod.
- Never log document contents, prompts containing sensitive data, or extracted sensitive field values.
- Use standard cryptography only. Keep encrypted payload formats versioned.
- Do not claim compliance or security properties that have not been implemented and reviewed.

## Architecture and stack

- Next.js App Router, strict TypeScript, React, Tailwind CSS, PostgreSQL, Drizzle ORM/Kit, Zod, pnpm.
- Prefer server components. Use client components only for interaction.
- Keep provider-specific code behind the existing identity, storage, encryption, audit, and AI boundaries.
- Do not fabricate ElectriPy APIs. Its current official package is Python-only; preserve the adapter boundary unless a supported TypeScript surface becomes available.
- Keep the default demo infrastructure-independent and reliable unless a replacement is equally deterministic.
- Do not add microservices, queues, Redis, or cloud storage without a concrete product requirement.

## UI quality

- All visible brand rendering goes through `BrandLockup`.
- Keep the warm-white, maroon, and restrained gold visual system centralized in `globals.css`.
- Do not use browser `alert`, `confirm`, or `prompt`.
- Preserve keyboard access, visible focus, semantic labels, reduced motion, and mobile behavior.
- Do not expose fake buttons or dead-end navigation.

## Required verification

Before handing off material changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add or update focused tests whenever authorization, encryption, AI schemas, or retrieval boundaries change.
