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
