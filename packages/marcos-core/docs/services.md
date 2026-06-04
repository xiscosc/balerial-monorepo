# Supporting services, persistence, errors

The pricing engine ([`pricing.md`](pricing.md)) and order lifecycle
([`orders.md`](orders.md)) are the core. This document covers everything around
them: customers, files, reports, config, public receipts, the persistence
layer, and the error/logging utilities.

---

## Customers — `CustomerService`

CRUD + search for shop customers (`{ id, storeId, name, phone }`).

- `createCustomer(name, phone)` / `updateCustomerData(customer, name?, phone?)`
  validate via `CustomerService.validate`:
  - name and phone required (non-empty),
  - phone must match `^\+\d{1,3}\d{9,15}$` (E.164-ish: leading `+`, country
    code, 9–15 digits) — else `InvalidDataError`.
- Reads: `getCustomerById`, `getCustomersByIds` (de-duped batch → map),
  `getCustomerByPhone`, `searchCustomers(query)` (normalised text search),
  `getAllCustomersPaginated(nextKey)`.
- `indexCustomers()` re-reads every customer and re-writes it, refreshing the
  persisted `normalizedName` search field (a maintenance / re-index op).
- `deleteCustomerById(id)`.

Persistence: primary key `uuid`, plus a **`store` GSI** on
`(storeId, phone)` enabling phone lookups within a store.

---

## Files & photos — `FileService`

Manages attachments (photos, videos, other docs, or an explicit "no artwork"
marker) for an order, stored in S3 (`filesBucket`) via
`@balerial/s3`'s `BalerialCloudFileService`.

- **Upload**: `createFile(orderId, fileName, variant?)` infers the MIME type
  (`mime-types`), classifies it (`classifyMimeType` → `PHOTO` / `VIDEO` /
  `OTHER`), generates a storage key
  (`<orderId>/<type>/<fileId>.<ext>`, photos prefixed by variant
  `original/` or `optimized/`), returns a **presigned upload URL** (300 s) with
  metadata (`store_id`, `order_id`, `file_id`, `type`), and logs an audit
  `ATTACHMENT` entry.
- `createNoArtFile(orderId)` records a `NO_ART` placeholder ("Sin Obra") with no
  S3 object.
- **Download**: `getFile` / `getFilesByOrder` return the file with **presigned
  download URLs** (600 s) for the optimized key (falling back to the original)
  and the thumbnail if present.
- **Delete**: `deleteFile` removes the DynamoDB record, logs an `ATTACHMENT`
  removal, and **tags every S3 key with `expiry=true`** (lifecycle-driven
  deletion) rather than deleting immediately. `NO_ART` files skip the S3 step.
- **Optimization sweep**: `optimizePhotoStorage()` finds originals that already
  have an optimized variant and tags the originals `expiry=true`, in batches of
  50 with a 1 s pause between batches. Image targets:
  optimized `width 2160 / quality 80`, thumbnail `80×80`.

`ImageVariant` = `ORIGINAL | OPTIMIZED | THUMBNAIL`; `FileType` =
`PHOTO | VIDEO | OTHER | NO_ART`. Failures during multi-key operations are
logged via the pino logger but don't abort the whole operation
(`Promise.allSettled`).

Persistence: composite primary key `(orderUuid, fileUuid)`.

---

## Reports — `ReportService`

Aggregates business activity into JSON reports stored in S3 (`reportsBucket`),
keyed by store and granularity.

### Daily report — `generateAndStoreDailyReport(date)`
Mines the **audit trail** for the day: keeps `STATUS` entries that represent an
order **becoming `PENDING`** (from null/quote → pending) — i.e. "new orders
booked today". For those orders it records `{ id, customerId, total }` and
aggregates part counts (`{ id, count }`). The report is content-hashed
(`sha256` of its JSON) for dedupe, then stored at
`<storeId>/daily/<y>/<m>/<d>/report.json`.

### Rollups
`upadateWeeklyReport` / `upadateMonthlyReport` append a daily report into the
week/month rollup (deduped by the daily report's hash). Stored at
`<storeId>/weekly/<y>/<week>/report.json` and `.../monthly/<y>/<m>/...`.

### Reads & dashboard
- `getDailyReport` / `getWeeklyReport` / `getMonthlyReport` return the stored
  JSON or an empty shell if absent.
- `getDashboardReport(start, end)` builds a `DashboardReport` over a range:
  daily cash & order counts, totals (orders, cash, customers, items), and
  **top 15 orders / top 15 customers / top 25 items** (items filtered by
  `isExcludedItem` — ids containing `sin_`, `cliente`, `espacio_blanco`,
  `fabric` are excluded as non-product lines). It picks the most efficient
  source for the range via `getDailyReportsBetweenDates` (same-day → daily;
  same-week → weekly; same-month → monthly; otherwise iterate months). The end
  date is clamped to today.

Report dates use the `ReportDate = { day, month, year }` shape; date maths is
Luxon-based.

---

## Public receipts — `PublicReceiptService`

Powers the read-only, shareable order page. Built only by
`ServiceFactory.createPublic(...)` → `PublicServiceFactory`, which exposes just
`pricingService`, `calculatedItemService`, and `publicReceiptService`, all bound
to the special `'public-repo'` store.

`getPublicOrder(shortId)` reads the order from the **public** order/customer
repositories (separate read-only views, keyed by `shortId`), rebuilds the
`FullOrder` with its calculated item and totals, and returns `null` if any piece
is missing.

---

## Store config — `ConfigService`

A tiny key/value store for per-store configuration. Currently only the
**locations list** (`LOCATIONS_CONFIG_ID = 'locations_config'`, a `string[]`):
`getLocationsList()` / `storeLocationsList(locations)`. Persistence uses a
composite primary key `(storeId, id)`.

---

## Users — `UserService`

Stateless helper. `generateStaticUser(id, name, storeId)` builds a `StaticUser`
(the lightweight user reference stored on orders/audit entries). The richer
`AppUser` adds `priceManager: boolean` and is supplied by the host app via
config, not created here.

---

## Persistence layer (DynamoDB)

Repositories wrap `@balerial/dynamo`'s `BalerialDynamoRepository` and own the
DTO ⇄ domain translation. Table + index shapes are declared once in
**`src/repository/dynamodb/table/table.builders.dynamodb.ts`** (exported via the
`.../core/db` entry point so the CDK app in `apps/marcos-aws` can provision
matching tables).

| Table (builder) | Primary key | Secondary indexes (GSI) |
|---|---|---|
| `orderTableBuilder` | `uuid` | `customer (customerUuid,timestamp)`, `shortId`, `status (status,timestamp)`, `store (storeId,timestamp)`, `publicId` — `shortId` exposed publicly |
| `calculatedItemTableBuilder` | `orderUuid` | public primary index |
| `customerTableBuilder` | `uuid` | `store (storeId,phone)` — public primary index |
| `listPricingTableBuilder` | `uuid` | `type (type,id)` |
| `orderAuditTrailTableBuilder` | `uuid` | `order (orderUuid,timestamp)`, `store (storeId,timestamp)` |
| `orderSetTableBuilder` | `uuid` | `hash` |
| `fileTableBuilder` | `(orderUuid, fileUuid)` | — |
| `configTableBuilder` | `(storeId, id)` | — |

The `timestamp` sort keys make the time-range queries possible
(same-day orders, audit entries for a day, etc.). `setPublicPrimaryIndex` /
`setPublicSecondaryIndexes` mark which access paths the public, read-only store
is allowed to use.

**DTO vs domain**: DTOs use `uuid` where domain types use `id`, store dates as
epoch millis (`timestamp`), and carry denormalised search fields
(`normalizedName`, `normalizedDescription`). Each service's static
`toDto`/`fromDto` is the single conversion boundary and also where defaults for
older records are filled in (e.g. `discountAllowed ?? true`,
`dimensionsType` inferred from legacy `exterior*` fields).

---

## Errors — `src/error`

Typed `Error` subclasses (each restores its prototype chain so `instanceof`
works across the transpile boundary):

| Error | Thrown when |
|---|---|
| `InvalidDataError` | Invalid item/customer/payment input (bad quantity, phone, negative amount). |
| `InvalidSizeError` | Requested dimensions exceed an entry's max, or no `FIT_AREA` step matches. Carries a Spanish, user-facing message. |
| `InvalidKeyError` | A price `id` already exists under a different uuid (uniqueness violation). |

`InvalidSizeError` messages are surfaced directly to users, so they're written
in Spanish.

---

## Logging — `src/logger/logger.ts`

`getLogger(name, forLambda?)` returns a [pino](https://getpino.io) logger.
Outside Lambda it pretty-prints (colorized) for local dev; inside Lambda it logs
plain JSON (CloudWatch-friendly). `getLoggerForLambda(name)` is the Lambda
shortcut. Currently used by `FileService` for the storage-optimization sweeps.

---

## Configuration recap

All services take an `ICoreConfiguration` (carries explicit AWS
`region` + `credentials`) or `ICoreConfigurationForAWSLambda` (no credentials —
uses the execution role). `getClientConfiguration(config)` returns `{}` for
Lambda or `{ region, credentials }` otherwise, and is what every repository and
S3 service is initialised with. The config also carries every table/bucket name,
the current `user`, the `storeId`, and `disableOrderAuditTrail`. Missing a
required table/bucket name throws at construction time (fail fast).
</content>
