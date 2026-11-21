# marcos e2e tests

Playwright tests that drive the real app in Chromium: SvelteKit routes, load functions, form actions,
hooks and the better-auth login. They run against the same offline stack as `bun run dev` (AWS Emulator +
mock OIDC), but on their own port (5174) and their own `e2e-*` tables, seeded from the anonymized fixture
in `packages/marcos-core/test/fixtures/data.json`.

## Run

One-time, in `apps/marcos`: `bunx playwright install chromium`.

| What                                     | Command (repo root unless noted)                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Everything, headless, fresh seed         | `bun run test:e2e`                                                                                                                                             |
| Interactive UI mode (pick, watch, debug) | `bun run test:e2e:ui`                                                                                                                                          |
| Reset the e2e data only                  | `bun run e2e:seed`                                                                                                                                             |
| One file, emulators already up           | `bun run --cwd apps/marcos test:e2e customers`                                                                                                                 |
| Step through a test                      | `bun run --cwd apps/marcos test:e2e customers --debug`                                                                                                         |
| Last report and traces                   | `bunx playwright show-report` (in `apps/marcos`)                                                                                                               |
| Record clicks as code                    | start `bun run --cwd apps/marcos dev:e2e`, then in `apps/marcos`: `bunx playwright codegen --load-storage=playwright/.auth/manager.json http://127.0.0.1:5174` |

`bun run dev` (5173, `dev-*` tables) and the e2e run (5174, `e2e-*` tables) share the containers but no
data, so both can run at once. `bun run dev:down` stops the containers.

CI (`.github/workflows/marcos-e2e.yml`, PRs into `main`) runs the same specs and config through
`apps/marcos-aws/local/e2e-native.sh`, which starts the emulator natively instead of via Docker. On
failure the HTML report and traces are uploaded as the `playwright-report` artifact.

If the Chromium on your machine doesn't match the pinned Playwright version, point
`E2E_CHROMIUM_PATH` at a Chromium binary.

## Layout

- `../playwright.config.ts`: projects, web server (`bun run dev:e2e`), base URL
- `auth.setup.ts`: logs in once per role through the mock OIDC form, stores the session in `playwright/.auth/`
- `support/env.ts`: base URL, role → mock username, store id
- `support/fixture.ts`: the seeded dataset, to pick rows from in read-only tests

## Write a test

The file suffix decides who the test runs as:

| Suffix               | Logged in as                                                 |
| -------------------- | ------------------------------------------------------------ |
| `*.manager.spec.ts`  | `e2e-manager`: price manager in the main store `local-store` |
| `*.external.spec.ts` | `ext-e2e`: external store                                    |
| `*.public.spec.ts`   | nobody                                                       |

```ts
// e2e/customers.manager.spec.ts
import { test, expect } from '@playwright/test';
import { uniquePhone } from './support/fixture';

test('create customer', async ({ page }) => {
	await page.goto('/customers/new');
	await page.getByLabel('Nombre').fill('E2E Cliente');
	await page.getByLabel('Teléfono').fill(uniquePhone());
	await page.getByRole('button', { name: 'Crear' }).click();
	await expect(page).toHaveURL(/\/customers\/[^/]+$/);
});
```

Rules:

- Find elements the way a user does: `getByRole`, `getByLabel`, visible Spanish text. Add a `data-testid`
  only when an element has no accessible name (e.g. icon-only buttons).
- No `waitForTimeout`. `expect(...)` assertions retry until they pass or time out.
- Tests run in parallel. Read-only tests use fixture rows; tests that write create their own customer/order
  first and never change fixture rows other tests read.
- Shared flows (create a customer, create an order) go in `support/` as functions taking `page`.
