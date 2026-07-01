# DynamoDB schemas

This document describes every DynamoDB table used by the system: keys, global secondary indexes (GSIs), stored attributes, and which indexes are exposed to the public order-tracking flow.

## Where schemas are defined

There is a single source of truth for table shapes, shared between the application and the infrastructure:

- **Index definitions** (partition/sort keys, GSIs): builders in [`src/repository/dynamodb/table/table.builders.dynamodb.ts`](../src/repository/dynamodb/table/table.builders.dynamodb.ts), built with `BalerialDynamoTableBuilder` from `@balerial/dynamo`.
- **Stored attributes**: DTO types in [`src/repository/dto/`](../src/repository/dto/). Repositories persist these DTOs as-is; anything optional in the DTO may be absent on the item.
- **Table creation**: the CDK construct `apps/marcos-aws/lib/database/dynamo-db.construct.ts` consumes the same builders, so changing a builder changes both the app's queries and the deployed infrastructure.

Changing a key or index therefore means: update the builder, deploy the CDK stack, and (if keys changed) migrate data — DynamoDB does not allow changing the primary key of an existing table, which is why some table names carry version suffixes (see below).

## Common settings

- All tables are created as `${CDK_ENV_NAME}-<name>` (e.g. `dev-order-v2`, `prod-order-v2`). The app receives the full names via environment variables (`ORDER_TABLE`, `CUSTOMER_TABLE`, …).
- Billing mode: **pay-per-request** (no provisioned capacity).
- Point-in-time recovery: enabled **only when `CDK_ENV_NAME` is `prod`**. Non-prod tables have no backups.
- The `-v2` / `-v3` suffixes are historical: they mark schema migrations that required a new table (DynamoDB keys are immutable). Tables without a suffix are still on their first schema.

## Public access (order tracking)

The public order-tracking pages use a narrow IAM policy (`${CDK_ENV_NAME}-public-track-orders-policy`) that only allows `dynamodb:Query` on indexes explicitly marked public in the builders (`setPublicPrimaryIndex()` / `setPublicSecondaryIndexes()`):

| Table                   | Public indexes |
| ----------------------- | -------------- |
| `customer-v2`           | primary index  |
| `calculated-item-order` | primary index  |
| `order-v2`              | `shortId` GSI  |

Everything else is inaccessible to the public credentials. If a new public-facing query is added, the corresponding index must be marked public in the builder and the stack redeployed.

## Tables

Key types: `S` = string, `N` = number.

### `${env}-order-v2` — orders and quotes

Env var: `ORDER_TABLE` · DTO: [`order.dto.ts`](../src/repository/dto/order.dto.ts)

| Index                    | Partition key      | Sort key        |
| ------------------------ | ------------------ | --------------- |
| Primary                  | `uuid` (S)         | —               |
| GSI `customer`           | `customerUuid` (S) | `timestamp` (N) |
| GSI `shortId` _(public)_ | `shortId` (S)      | —               |
| GSI `status`             | `status` (S)       | `timestamp` (N) |
| GSI `store`              | `storeId` (S)      | `timestamp` (N) |
| GSI `publicId`           | `publicId` (S)     | —               |

Attributes: `uuid`, `shortId`, `customerUuid`, `timestamp`, `storeId`, `userId`, `userName`, `amountPayed`, `item` (nested `ItemDto` map — dimensions, delivery date, parts to calculate, observations), `status`, `publicId`, and optional `hasArrow`, `location`, `notified`, `invoiced`.

### `${env}-customer-v2` — customers

Env var: `CUSTOMER_TABLE` · DTO: [`customer.dto.ts`](../src/repository/dto/customer.dto.ts)

| Index              | Partition key | Sort key    |
| ------------------ | ------------- | ----------- |
| Primary _(public)_ | `uuid` (S)    | —           |
| GSI `store`        | `storeId` (S) | `phone` (S) |

Attributes: `uuid`, `name`, `normalizedName` (lowercased/diacritics-stripped, for search), `phone`, `storeId`. The `store` GSI enforces customer lookup by phone within a store.

### `${env}-calculated-item-order` — calculated (priced) items

Env var: `CALCULATED_ITEM_ORDER_TABLE` · DTO: [`calculated-item.dto.ts`](../src/repository/dto/calculated-item.dto.ts)

| Index              | Partition key   | Sort key |
| ------------------ | --------------- | -------- |
| Primary _(public)_ | `orderUuid` (S) | —        |

One item per order (1:1 with `order-v2`). Attributes: `orderUuid`, `discount`, `quantity`, `parts` (list of `{ priceId, price, quantity, description, discountAllowed?, log?, floating? }`).

### `${env}-list-pricing-v2` — pricing catalog

Env var: `LIST_PRICING_TABLE` · DTO: [`list-price.dto.ts`](../src/repository/dto/list-price.dto.ts)

| Index      | Partition key | Sort key |
| ---------- | ------------- | -------- |
| Primary    | `uuid` (S)    | —        |
| GSI `type` | `type` (S)    | `id` (S) |

Attributes: `id`, `uuid`, `price`, `description`, `type` (price category, e.g. mold/glass/back), `formula` (see [pricing.md](pricing.md)), `areas` / `areasM2` (dimension-banded prices), and optional `minPrice`, `discountAllowed`, `maxD1`, `maxD2`, `priority`, `floating`. The `type` GSI drives the pricing pickers in the UI.

### `${env}-file` — order attachments metadata

Env var: `FILE_TABLE` · DTO: [`file.dto.ts`](../src/repository/dto/file.dto.ts)

| Index   | Partition key   | Sort key       |
| ------- | --------------- | -------------- |
| Primary | `orderUuid` (S) | `fileUuid` (S) |

Attributes: `orderUuid`, `fileUuid`, `type`, `key` (S3 object key in the files bucket), `originalFilename`, and optional `thumbnailKey` / `optimizedKey` (written by the image-optimization Lambda).

### `${env}-config` — per-store configuration

Env var: `CONFIG_TABLE` · DTO: [`config.dto.ts`](../src/repository/dto/config.dto.ts)

| Index   | Partition key | Sort key |
| ------- | ------------- | -------- |
| Primary | `storeId` (S) | `id` (S) |

Key-value store scoped by store. `value` is arbitrary JSON (primitives, lists, or maps).

### `${env}-order-set` — printable order groupings

Env var: `ORDER_SET_TABLE` · DTO: [`order-set.dto.ts`](../src/repository/dto/order-set.dto.ts)

| Index      | Partition key | Sort key |
| ---------- | ------------- | -------- |
| Primary    | `uuid` (S)    | —        |
| GSI `hash` | `hash` (S)    | —        |

Attributes: `uuid`, `hash` (deduplicates identical sets), `timestamp`, `userId`, `userName`, `orderIds`.

### `${env}-order-audit-trail-v3` — audit trail (analytics)

Env var: `ORDER_AUDIT_TRAIL_TABLE` · DTO: [`order-audit-trail-entry.dto.ts`](../src/repository/dto/order-audit-trail-entry.dto.ts)

| Index       | Partition key   | Sort key        |
| ----------- | --------------- | --------------- |
| Primary     | `uuid` (S)      | —               |
| GSI `order` | `orderUuid` (S) | `timestamp` (N) |
| GSI `store` | `storeId` (S)   | `timestamp` (N) |

Append-only log of order changes. Attributes: `uuid`, `orderUuid`, `userId`, `userName`, `storeId`, `type` (what changed), `oldValue` / `newValue` (scalar or full `OrderDto` snapshot), `timestamp`. The `store` GSI is what the daily report Lambda queries (by store and time range). See [orders.md](orders.md) for the audit-trail semantics.
