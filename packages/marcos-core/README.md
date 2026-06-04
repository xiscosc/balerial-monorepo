# `@marcsimolduressonsardina/core`

Core business logic for **Marcos MMSS**, the order-management and back-office
system for a custom picture-framing / mold shop. This package is **backend
framework-agnostic**: it contains the domain types, the pricing engine, the
order lifecycle, and the persistence layer (DynamoDB + S3). It is consumed by
the SvelteKit back-office app (`apps/marcos`) and by the Lambda handlers
(`packages/marcos-lambda-logic`).

It holds **no UI and no HTTP**. Everything is expressed as services that take a
configuration object and talk to AWS. The SvelteKit app injects these services
through `locals.services` (see the root `CLAUDE.md`).

---

## What this package does

A customer brings an object (a picture, a jersey, a mirror…) to be framed. A
shop employee builds an **order** describing:

- the **dimensions** of the work (width × height),
- an optional **passepartout** (`pp`, the mat border around the work),
- a list of **parts** to price: a mold (frame), glass, backboard, fabric,
  labour, hangers, transport, etc.

The package's job is to turn that description into a **price**, persist the
order, and support the back-office around it (customers, files/photos, audit
trail, reports, public receipts).

The two pieces worth understanding first are:

1. **The pricing engine** — how each part's price is computed from its
   dimensions and a configured price formula. → [`docs/pricing.md`](docs/pricing.md)
2. **The order lifecycle** — how an order is created, priced into a
   "calculated item", and how totals/discounts/payments work.
   → [`docs/orders.md`](docs/orders.md)

The remaining services (customers, files, reports, config, order sets, public
receipts) and the persistence layer are described in
[`docs/services.md`](docs/services.md).

---

## Package layout

```
src/
├── types/            Domain types (Order, Item, ListPrice, Customer, …) — see types/index.ts
├── service/          The services that contain all the logic
│   ├── pricing.service.ts            ← price computation entry point
│   ├── calculated-item.service.ts    ← turns an order's parts into priced parts
│   ├── order.service.ts              ← order lifecycle + totals
│   ├── order-set.service.ts          ← grouping orders for a customer
│   ├── customer.service.ts
│   ├── file.service.ts               ← photos/attachments on S3
│   ├── report.service.ts             ← daily/weekly/monthly/dashboard reports
│   ├── order-audit-trail.service.ts  ← change log per order
│   ├── config.service.ts             ← store config (locations list)
│   ├── public-receipt.service.ts     ← read-only public order view
│   ├── user.service.ts
│   ├── service-factory.ts            ← lazy DI container for all services
│   └── dto/order-creation.dto.ts     ← input shape for creating/updating orders
├── data/             Static pricing data + formulas
│   ├── static-pricing.ts   ← the pure pricing formula functions
│   ├── mold-matrix.ts      ← lookup table: small×large side → multiplier
│   └── mold-price.loader.ts← imports mold base prices from an Excel file in S3
├── utilities/        Pure helpers (pricing, calculated-item, order, search)
├── repository/       DynamoDB repositories + DTOs (persistence)
│   ├── dynamodb/...
│   ├── dynamodb/table/table.builders.dynamodb.ts ← table + GSI definitions
│   └── dto/...
├── configuration/    ICoreConfiguration + helpers
├── error/            Typed domain errors
└── logger/           pino logger factory
```

### Public entry points (`package.json` → `exports`)

| Import path | Resolves to | Contains |
|---|---|---|
| `.../core/service` | `src/service/index.ts` | All services + `ServiceFactory` |
| `.../core/type`    | `src/types/index.ts` | All domain types & enums |
| `.../core/dto`     | `src/service/dto/order-creation.dto.ts` | Order creation DTOs |
| `.../core/util`    | `src/utilities/index.ts` | Pricing/calculated-item/order/search utilities |
| `.../core/db`      | `src/repository/dynamodb/table/table.builders.dynamodb.ts` | Table builders for infra |
| `.../core/config`  | `src/configuration/core-configuration.interface.ts` | Config interfaces |
| `.../core/data`    | `src/data/mold-price.loader.ts` | Excel mold-price loader |
| `.../core/error`   | `src/error/index.ts` | Domain errors |
| `.../core/logger`  | `src/logger/logger.ts` | Logger factory |

---

## Architecture at a glance

```
            ┌─────────────────────────────────────────────┐
            │              ServiceFactory                  │  lazy DI, one per request
            └─────────────────────────────────────────────┘
                 │ creates & wires (singletons within a request)
     ┌───────────┼───────────────┬───────────────┬──────────────┐
     ▼           ▼               ▼               ▼              ▼
 OrderService  PricingService  CustomerService  FileService  ReportService …
     │              ▲
     │ depends on   │
     ▼              │
 CalculatedItemService ──── uses ──┘   (PricingService computes each part)
     │
     ▼
 DynamoDB repositories  ──►  AWS DynamoDB / S3
```

- **Services are stateless** beyond their injected config and collaborators.
  They are created lazily by `ServiceFactory` and re-wired per request, so they
  must never be shared across stores.
- **Repositories** wrap `@balerial/dynamo` and translate **DTOs** (the shape
  stored in DynamoDB) ↔ **domain types** (the shape used in code). Every
  service owns this `toDto`/`fromDto` boundary.
- **`storeId`** scopes nearly everything to a single shop. A special
  `'public-repo'` store powers the public, read-only receipt flow
  (`PublicServiceFactory`).

### Configuration

Services are constructed from an `ICoreConfiguration` (browser/server, carries
explicit AWS `region` + `credentials`) or `ICoreConfigurationForAWSLambda`
(runs inside Lambda, credentials come from the execution role). The config also
carries all table/bucket names, the current `user`, and feature switches like
`disableOrderAuditTrail`. See `src/configuration/core-configuration.interface.ts`.

### The `ServiceFactory`

`ServiceFactory.create(config)` (or `.createForLambda`) is the single
entry point. Each service is exposed via a lazy getter that builds the
dependency graph on first access — e.g. `orderService` pulls in
`customerService`, `calculatedItemService`, `pricingService` and
`orderAuditTrailService`.

There are also **markup-aware factories** (`createOrderServiceWithMarkup`,
`createPricingServiceWithMarkup`, …) used for *external* orders where a
percentage markup is layered on top of the base catalog prices. See the markup
section in [`docs/pricing.md`](docs/pricing.md).

`ServiceFactory.createPublic(config)` returns a `PublicServiceFactory` exposing
only the read-only services needed for the public receipt page.

---

## Conventions used throughout

- **Money** is rounded to cents; most formulas round **up** (`Math.ceil`) at
  the last step so the shop never under-charges. Some round to the nearest
  10 cents (`*10)/10`). The exact rounding per formula is documented in
  [`docs/pricing.md`](docs/pricing.md).
- **Dimensions** are in **centimetres**. Formulas that work in m² divide by 100
  per side.
- **IDs**: domain objects use `id` (a UUID); DTOs persist it as `uuid`. Price
  list entries additionally have a human/business `id` (e.g. a mold reference)
  and an `internalId` (the UUID).
- **Spanish UI text** lives in descriptions (e.g. `'Estirar tela'`,
  `'Cantoneras'`, `'Travesaño'`) because it surfaces directly in the UI.

---

## Further reading

| Doc | Covers |
|---|---|
| [`docs/pricing.md`](docs/pricing.md) | Price types, formulas, the mold matrix, fabric/crossbar, markup, dimension handling, validation |
| [`docs/orders.md`](docs/orders.md)   | Order/quote/external-order lifecycle, calculated items, discounts, totals, payments, audit trail |
| [`docs/services.md`](docs/services.md) | Customers, files, reports, order sets, config, public receipts, repositories, errors |
</content>
