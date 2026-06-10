# marcos — backoffice app

SvelteKit (Svelte 5) backoffice application for the Marcos MMSS order management system: orders, quotes, customers, pricing, file attachments, reports, and a public order-tracking interface. Deployed on Vercel.

UI text is in **Spanish** (the shop's working language).

## Local development

The app talks to **real AWS resources** (DynamoDB + S3) — there is no local emulator. Follow the "How to Develop" section in the [root README](../../README.md) to deploy the infrastructure and obtain credentials, then:

```bash
# 1. Configure the environment
cp .env.example .env   # fill in the values

# 2. From the repo root
bun install
bun run dev --filter=mmss-marcos-app
```

The dev server runs on `http://localhost:5173` (Vite with `--host`, so it is also reachable from other devices on your network). Environment variables are read via `$env/static/*`, so every variable in `.env.example` must be defined and the dev server must be restarted after changes.

### Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `bun run dev`         | Start the Vite dev server         |
| `bun run build`       | Production build (Vercel adapter) |
| `bun run preview`     | Preview a production build        |
| `bun run check`       | `svelte-check` type checking      |
| `bun run check:watch` | Type checking in watch mode       |
| `bun run lint`        | ESLint                            |
| `bun run format`      | Prettier                          |

There are no automated tests; run `lint`, `format`, and `check` before pushing.

## Project layout

```
src/
├── auth.ts                 # Better Auth + Auth0 configuration
├── hooks.server.ts         # Request pipeline (sequence of handles)
├── routes/
│   ├── (app)/              # Authenticated backoffice (orders, customers, pricing…)
│   ├── (public)/           # Unauthenticated pages (order tracking, receipts)
│   └── (other)/            # Auth and maintenance pages
└── lib/
    ├── components/         # Svelte components (reuse these — see Conventions)
    ├── server/             # Server-only code (services, hooks, tracking)
    ├── shared/             # Client/server shared code (tracking, feature flags)
    ├── data/               # Static data, including the user-facing changelog
    └── ...
```

The path alias `@/` maps to `src/lib/`.

## Architecture notes

- **Services via `locals`** — business logic lives in `@marcsimolduressonsardina/core` and is injected through SvelteKit `locals`: `locals.services` (a lazy `ServiceFactory`), `locals.config`, `locals.user`, and `locals.trackingContext`. Do not instantiate services directly in server files.
- **Hooks pipeline** — `hooks.server.ts` composes handles with `sequence()`: tracking context → maintenance redirect → Auth0 session → user/config/services population → API auth. New cross-cutting concerns should be added as a handle in `src/lib/server/shared/`.
- **Authentication** — Better Auth with Auth0 as a generic OAuth provider (`src/auth.ts`). Users must carry `storeId` and `priceManager` in their Auth0 `app_metadata`; without them login is rejected.
- **Tracking** — two systems: client-side `Tracking` singleton (`@/shared/tracking`, PostHog in production, no-op in dev) and server-side `locals.trackingContext`. Feature flags come from PostHog via the `ServerFeature` / `ClientFeature` enums.
- **Maintenance mode** — set `MAINTENANCE_MODE=true` to redirect all traffic to `/maintenance` (requires a redeploy to toggle).
- **Public tracking** — the `(public)` routes use a separate, narrower AWS credential pair (`TRACK_AWS_*`) restricted to the public-track-orders IAM policy.

## Conventions

- Reuse components from `src/lib/components/` — never invent ad-hoc styles for borders, cards, or containers. Use the `Box` component (`src/lib/components/generic/Box.svelte`) for card-like containers.
- Changelog entries (`src/lib/data/changelog.ts`) are user-facing, written in Spanish, and shown in the app.
- Env vars are accessed through `$env/static/private` / `$env/static/public`, never `process.env`.

## Deployment

Deployed on Vercel via `@sveltejs/adapter-vercel` (auto-detected through `adapter-auto`). Vercel builds the app on push; environment variables come from the Vercel project settings. The AWS infrastructure it depends on is deployed separately from `apps/marcos-aws` (see the root README's Deployment section).

## Further reading

- [Root README](../../README.md) — setup, environment variables, deployment
- [Core package docs](../../packages/marcos-core/README.md) — pricing engine, order lifecycle, services
- [DynamoDB schemas](../../packages/marcos-core/docs/database.md) — tables, keys, and indexes
