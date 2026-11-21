# Handover: Playwright e2e for `apps/marcos`

Branch: `claude/epic-ritchie-0behku` (based on `main` @ `8b338b7`). Delete this file before merging.

## Goal

Browser e2e tests for the SvelteKit app, runnable the same way locally (Docker) and in CI.
Agreed scope so far: **scaffolding only, no specs**. Specs come in a later step.

## What's on the branch (commit `66fa98a`)

- `apps/marcos/playwright.config.ts`: projects `setup`, `manager`, `external`, `anonymous`. The file suffix picks the role
  (`*.manager.spec.ts`, `*.external.spec.ts`, `*.public.spec.ts`). Playwright starts the app itself with `bun run dev:e2e`.
- `apps/marcos/e2e/auth.setup.ts`: logs in once per role through the real better-auth → mock OIDC form and saves
  `apps/marcos/playwright/.auth/{manager,external}.json` (gitignored).
- `apps/marcos/e2e/support/env.ts`: base URL `http://127.0.0.1:5174`, role → mock username (`e2e-manager`, `ext-e2e`).
- `apps/marcos/e2e/support/fixture.ts`: reads `packages/marcos-core/test/fixtures/data.json`, plus `uniquePhone()` / `runId`.
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

## Verified vs not verified

The cloud session had no Docker, and the network policy blocked `downloads.aws.com` and `pkg-containers.githubusercontent.com`.

Verified:

- `playwright test --list` finds the 2 setup tests.
- `dev:e2e` boots on 5174, `/` → 303 `/auth/signin`, and the proxies target 9297/9298.
- `tsc --strict` passes on the e2e files.
- `bun run lint` is clean.

**Not verified:** a real run. The full login flow (mock form → better-auth callback → app) has never been executed.

## Next steps on your machine

1. Get the branch and install:
   ```bash
   git fetch origin claude/epic-ritchie-0behku && git checkout claude/epic-ritchie-0behku
   bun install
   (cd apps/marcos && bunx playwright install chromium)
   ```
2. Run `bun run test:e2e`. You should get 2 passed tests and both `.auth/*.json` files. If something fails, open the trace
   with `cd apps/marcos && bunx playwright show-report`. Places to look first:
   - `waitForURL` in `auth.setup.ts`: where the app lands after login (`/` for the manager, maybe `/external` for `ext-e2e`)
   - the better-auth warning "Base URL is not set": it derives the origin from the request, and that worked in offline dev
3. Run it a second time (the seed reset should keep it green), and once with `bun run dev` active on 5173 (there should be no clash).
4. Open a PR and check that the `marcos-e2e` workflow goes green.
5. Pending decision: move the fixture to `apps/marcos-aws/local/fixtures/data.json`, next to `seed.ts` and `snapshot.ts`,
   since both test suites now use it. Four references change:
   - `packages/marcos-core/.env.test` (`SEED_FILE`)
   - `packages/marcos-core/test/support.ts` (import)
   - `apps/marcos/e2e/.env.seed`
   - `apps/marcos/e2e/support/fixture.ts`
6. Then the first specs (plan, not started):

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
