# Handover: Playwright e2e for `apps/marcos`

Branch: `claude/epic-ritchie-0behku` (based on `preview` @ `8b338b7`). Delete this file before merging.

## Goal

Browser e2e tests for the SvelteKit app, runnable the same way locally (Docker) and in CI.
Agreed scope so far: **scaffolding only, no specs**. Specs come in a later step.

## What's on the branch

- `apps/marcos/playwright.config.ts`: projects `setup`, `manager`, `external`, `anonymous`. The file suffix picks the role
  (`*.manager.spec.ts`, `*.external.spec.ts`, `*.public.spec.ts`). Playwright starts the app itself with `bun run dev:e2e`.
- `apps/marcos/e2e/auth.setup.ts`: logs in once per role through the real better-auth → mock OIDC form and saves
  `apps/marcos/playwright/.auth/{manager,external}.json` (gitignored).
- `apps/marcos/e2e/support/env.ts`: base URL `http://127.0.0.1:5174`, role → mock username (`e2e-manager`, `ext-e2e`).
- `apps/marcos/e2e/support/fixture.ts`: reads `apps/marcos-aws/local/fixtures/data.json` (shared with the marcos-core tests), plus `uniquePhone()` / `runId`.
- `apps/marcos/e2e/README.md`: how to run and write tests, with conventions.
- `apps/marcos/.env.e2e` (Vite `--mode e2e`): `e2e-*` tables/buckets, issuer on port 5174.
- `apps/marcos/e2e/.env.seed`: same table names, `SEED_FILE` = the fixture, `SEED_RESET=true`.
- `apps/marcos/vite.config.ts`: the `/__aws` + `/__oidc` proxy is enabled for `offline` and `e2e` modes.
- Scripts:
  - root: `e2e:seed`, `test:e2e`, `test:e2e:ui` (start compose, seed, run)
  - `apps/marcos`: `dev:e2e`, `test:e2e`, `test:e2e:ui`
- CI: `.github/workflows/marcos-e2e.yml` on PRs into `main` runs `apps/marcos-aws/local/e2e-native.sh`
  (native emulator + `docker run` mock OIDC). The emulator startup was moved into `emulator-native.sh`, which
  `test-native.sh` now sources too.
- Docs: README (scripts table and "Before committing"), AGENTS.md/CLAUDE.md commands.
- `@playwright/test` pinned at `1.65.1`.

## Status

Verified locally (Colima): `bun run test:e2e` passes (2/2 logins, both `.auth/*.json` written), stays green on rerun
and with `bun run dev` running on 5173. `bun run test` (marcos-core) passes with the moved fixture.

Done:

- Fixture moved to `apps/marcos-aws/local/fixtures/data.json`.
- `.gitignore` now matches `apps/marcos/playwright/.auth` (the old `playwright/.auth` only matched at the repo root).

Note: `marcos-e2e` (like `marcos-core-tests`) only triggers on PRs into `main`, so the PR into `preview` does not run it.

## Next: first specs (not started)

| Spec                           | Covers                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| `track.public.spec.ts`         | anon redirect to sign-in; `/track/<shortId>` works without login   |
| `orders-read.manager.spec.ts`  | order list with fixture orders, order detail totals/customer       |
| `customers.manager.spec.ts`    | search a fixture customer, create a new one                        |
| `order-create.manager.spec.ts` | order via `OrderForm` for a new customer, computed total           |
| `order-status.manager.spec.ts` | status/payment/location bottom sheets on an order the test created |
| `external.external.spec.ts`    | `/external`, create an external order, main-store routes blocked   |

Still to check when writing them:

- that formsnap `Form.Label` links to the input, so `getByLabel` works
- that `MarcosButton` renders a `<button>` named by its text
- that `/track` shows `publicId` as text

## Gotchas

- `bun.lock`: besides Playwright, `svelte-check` moved under `mmss-marcos-app/`. That is bun's own resolution
  (`main` produces the same drift with Bun 1.4.4), not something from this branch.
- Ports:
  - 5173: `bun run dev`
  - 5174: e2e
  - 9297: AWS Emulator
  - 9298: mock OIDC
- `E2E_CHROMIUM_PATH` overrides the browser binary if your Chromium doesn't match Playwright 1.65.1.
- Interactive debugging: `bun run test:e2e:ui`. To record clicks as code, start `bun run --cwd apps/marcos dev:e2e`, then from `apps/marcos`:
  `bunx playwright codegen --load-storage=playwright/.auth/manager.json http://127.0.0.1:5174`.
