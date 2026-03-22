# Marcos MMSS

Order management and back-office system for a print/mold shop. Turborepo monorepo.

## Tech

- SvelteKit + Svelte 5 + TailwindCSS (frontend)
- AWS DynamoDB + S3 + Lambda (backend)
- Auth0 (authentication)
- PostHog (analytics)
- TypeScript throughout

## Structure

- `apps/marcos` — SvelteKit backoffice app (deployed on Vercel)
- `apps/marcos-aws` — AWS CDK infrastructure
- `packages/marcos-core` — Core business logic and services
- `packages/marcos-lambda-logic` — Lambda handlers
- `packages/balerial-s3` — S3 utilities
- `packages/balerial-dynamo` — DynamoDB utilities
- `packages/eslint-config` — Shared ESLint config
- `packages/typescript-config` — Shared TypeScript config

## Commands

```bash
bun install           # Install dependencies
bun dev               # Start dev server
bun build             # Build all packages
bun lint              # Lint all packages
bun format            # Format with Prettier
```

## Conventions

- Package manager: bun (do not use npm, yarn, or pnpm)
- Node.js 22+
- Use `$env/static/private` and `$env/static/public` for env vars in SvelteKit (not process.env)
- Path alias `@/` maps to `src/lib/` in the marcos app
- Changelog entries in `apps/marcos/src/lib/data/changelog.ts` should be user-friendly and in Spanish
- UI text is in Spanish

## UI components

When building or editing UI, always reuse existing components from `src/lib/components/`. Never invent ad-hoc styles for borders, cards, or containers — use the `Box` component (`src/lib/components/generic/Box.svelte`) for card-like containers. Follow the patterns established in existing pages like `ErrorBox.svelte` for full-page centered layouts. Check existing components before writing custom markup.

## Server-side architecture (SvelteKit)

Services and config are injected via SvelteKit `locals` — do not instantiate them directly in server files.

- `locals.services` — `ServiceFactory` instance (lazy-initialized; access services via getters e.g. `locals.services.orderService`)
- `locals.config` — `ICoreConfiguration` with AWS/DB config
- `locals.user` — authenticated `AppUser` (may be undefined for public routes)
- `locals.trackingContext` — server-side tracking context

`ServiceFactory` lives in `packages/marcos-core/src/service/service-factory.ts`. It lazily creates service instances and handles dependency injection between them (e.g. `orderService` depends on `customerService`, `pricingService`, etc.).

## Tracking

Two separate tracking systems exist:

- **Client-side**: `Tracking` singleton from `@/shared/tracking` (`src/lib/shared/tracking/`). Uses `PostHogTracking` in production and `NoOpTracking` in dev/disabled mode. `NoOpTracking` only logs in the browser (guarded by `browser` from `$app/environment`).
- **Server-side**: `locals.trackingContext` injected via hooks, backed by `src/lib/server/shared/tracking/`.

## Feature flags

Feature flags are managed via PostHog. Two enums define them:

- **Server-side**: `ServerFeature` in `src/lib/server/shared/tracking/server.features.ts`
- **Client-side**: `ClientFeature` in `src/lib/shared/tracking/client.features.ts`

Feature flag checks should happen in SvelteKit hooks or load functions — not inside services like `AuthService`.

## Maintenance mode

Maintenance mode is controlled by the `MAINTENANCE_MODE` env var (set to `true` to enable). It is enforced via a dedicated SvelteKit handle (`maintenanceHandle` in `src/lib/server/shared/maintenance/`) that runs early in the hook sequence. When enabled, all requests (except `/maintenance` itself) are redirected to `/maintenance`. The maintenance page auto-refreshes every 30s via `invalidateAll()` so users are redirected back once the flag is disabled (requires redeployment to toggle).

## Hooks architecture

Request handling is composed via `sequence()` in `hooks.server.ts`. Each concern lives in its own module:

1. `ServerTracking.contextHandle` — injects `locals.trackingContext`
2. `maintenanceHandle` — feature-flag-gated redirect to `/maintenance`
3. `authHandle` — Auth0 session handling
4. `getUserHandle` — populates `locals.user`, `locals.config`, `locals.services`
5. `apiAuthHandle` — API route authentication

New cross-cutting concerns should follow this pattern: create a handle in `src/lib/server/shared/` and add it to the sequence.
