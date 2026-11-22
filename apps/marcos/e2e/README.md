# marcos e2e tests

Playwright tests that drive the real app in Chromium: SvelteKit routes, load functions, form actions,
hooks and the better-auth login. They run against the same offline stack as `bun run dev` (AWS Emulator +
mock OIDC), but on their own port (5174) and their own `e2e-*` tables, seeded from the anonymized fixture
in `apps/marcos-aws/local/fixtures/data.json`.

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

```
e2e/
├── auth.setup.ts          logs in once per role, stores the session in playwright/.auth/
├── orders/                create, edit, duplicate, delete, quote ↔ order, status, same day, print, lookup, bulk
├── order-list/            orders list, its filters and search
├── customers/             create, edit, delete, list and search customers
├── config/                prices and locations
├── public/                receipt and tracking pages
├── fixtures/              files tests upload (molds.xlsx)
└── support/
    ├── test.ts            the `test` and `expect` every spec imports
    ├── claims.ts          which seeded orders and customers each test may use
    ├── fixture.ts         the seeded dataset and helpers to query it
    ├── dates.ts           ISO dates and the app's dd/MM/yyyy format
    ├── env.ts             base URL, role → mock username
    ├── qr.ts              decodes a QR image
    └── pages/             helpers for the order page, order form, files page, customer form and new-order flow
```

The mock OIDC users are mapped in `apps/marcos-aws/local/oidc.json` by username: `ext*` → external store,
`staff*` → main store without price manager, anything else → price manager in the main store.

## Write a test

1. **Pick the folder and role.** Put the spec in the folder of the feature. The file suffix decides who it
   runs as:

   | Suffix                   | Logged in as                                                 |
   | ------------------------ | ------------------------------------------------------------ |
   | `*.manager.spec.ts`      | `e2e-manager`: price manager in the main store `local-store` |
   | `*.staff.spec.ts`        | `staff-e2e`: main store `local-store`, not a price manager   |
   | `*.external.spec.ts`     | `ext-e2e`: external store                                    |
   | `*.public.spec.ts`       | nobody                                                       |
   | `*.manager.last.spec.ts` | `e2e-manager`, but only after every other test has finished  |

   Use `.last` for tests that replace data the whole suite shares, like uploading a mold file (it
   replaces every mold price). They are skipped if an earlier test fails, and after them the e2e data no
   longer matches the seed, so run `bun run e2e:seed` before running other tests again.

2. **Import `test` and `expect` from `support/test.ts`**, not from `@playwright/test`. Besides `page`, a
   test can ask for:

   | Fixture        | What it does                                                                               |
   | -------------- | ------------------------------------------------------------------------------------------ |
   | `open(path)`   | goes to a page and waits until it's hydrated, before clicking buttons that navigate        |
   | `orderPage`    | the order page: open, status, location, payment, invoice, convert, edit, duplicate, delete |
   | `orderForm`    | the order form: fields, sections, molds, missing reasons, `fillWholeOrder()`               |
   | `newOrder`     | after the form: create, link the order to a new or existing customer                       |
   | `filesPage`    | "Archivos y fotos": upload a picture, "Volver al pedido"                                   |
   | `customerForm` | the customer form; `typePhone` types a number after the prefilled `+34`                    |

3. **Claim the seeded data you use in `support/claims.ts`.** Tests run in parallel against the same seed.
   A test that changes an order or customer claims it with `claimOrder` / `claimCustomer`; a test that
   only reads uses `readOrder` / `readOrders`. Claims run in a fixed order and the suite fails as soon as it
   loads if a test needs data another test changes. Data a test creates itself (a new customer or order)
   needs no claim, but give it a name or description that doesn't match seeded data, so list and search
   tests don't pick it up.

4. **Find elements the way a user does:** `getByRole`, `getByLabel`, visible Spanish text. When an element
   has no accessible name, add an `aria-label` to the component (it must not change behaviour or looks).

```ts
import { test, expect } from '../support/test';
import { orderToEdit as order } from '../support/claims';

test('mark an order as invoiced', async ({ page, orderPage }) => {
	await orderPage.open(order.uuid);
	await orderPage.markInvoiced();
	await expect(page.getByRole('button', { name: 'Facturado', exact: true })).toBeVisible();
});
```

Rules:

- No `waitForTimeout`. `expect(...)` assertions retry until they pass or time out (5s locally, 10s in CI).
- Don't rely on list positions that other tests can change by creating data.
- `bun run --cwd apps/marcos check` type-checks the e2e folder too.
