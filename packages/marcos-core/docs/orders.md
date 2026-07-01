# Orders, calculated items & totals

How an order goes from "an employee filled a form" to a persisted, priced
order with running totals and a full change history.

Key files:

- **`src/types/order.type.ts`** — `Order`, `Item`, `CalculatedItem`, totals,
  enums.
- **`src/service/order.service.ts`** — lifecycle + totals.
- **`src/service/calculated-item.service.ts`** — pricing each part into a
  `CalculatedItem`.
- **`src/service/order-audit-trail.service.ts`** — per-order change log.
- **`src/service/dto/order-creation.dto.ts`** — input shape.

---

## 1. The domain model

### `Item` — what is being framed
The physical description an employee enters:

```ts
Item {
  width, height          // cm, the work itself
  pp                     // uniform passepartout border (cm)
  ppDimensions?          // { up, down, left, right } overrides uniform pp
  floatingDistance       // gap for "floating" mounting
  dimensionsType         // NORMAL | EXTERIOR | ROUNDED | WINDOW
  exteriorWidth/Height?  // when measuring the outer frame instead of the work
  description, observations, predefinedObservations[]
  quantity               // how many identical units
  deliveryDate, instantDelivery
  partsToCalculate: PreCalculatedItemPart[]   // ← the things to price
}
```

A **`PreCalculatedItemPart`** is a request to price one part:
`{ type: PricingType, id, quantity, moldId?, extraInfo? }`. `moldId` is only for
fabric crossbars (links to the mold whose price drives the crossbar);
`extraInfo` is free text folded into the description (e.g. a passepartout note).

### `Order` — the business object
Wraps an `Item` with customer, store, user, status, payment and identifiers:

```ts
Order {
  id           // UUID
  shortId      // nanoid(10), used internally
  publicId     // "DDMMYYYY/XX/<phone>" — shareable receipt id
  storeId, user, customer
  createdAt, status
  amountPayed, invoiced, notified, hasArrow, location
  item: Item
}
```

### `OrderStatus`
`PENDING` → `FINISHED` → `PICKED_UP`, plus `QUOTE` (a saved estimate, not a real
order) and `DELETED`. Quotes use a sentinel delivery date `31/12/9999`
(`quoteDeliveryDate`).

### `ExternalOrder`
A leaner order for external/wholesale pricing. It has a `reference` instead of a
customer and is **not persisted** the same way — `createExternalOrderFromDto`
computes and returns it (with markup) but does not write an order row. Its
`reference` encodes the totals: `"<total>/<markup>/<totalWithoutMarkup>"`.

---

## 2. From form to priced order

The SvelteKit app submits an **`OrderCreationDto`** (the `Item` fields + a
`customerId?`, `discount`, `extraParts`, `isQuote`, `hasArrow`,
`dimensionsType`, …). `OrderService.createOrderFromDto`:

1. Resolves the customer (`customerId`), or falls back to the **temp customer**
   (`tempCustomerUuid`, phone `+34612345678`) for walk-ins not yet identified.
2. `generateOrderAndCalculatedItemFromDto`:
   - Builds the `Order` (new UUID, status = `QUOTE` if `isQuote` else
     `PENDING`).
   - **`optimizePartsToCalculate`** de-duplicates parts: identical
     `type_id_moldId_extraInfo` combos are merged and their quantities summed.
   - Generates `shortId` (`nanoid(10)`) and `publicId`
     (`DDMMYYYY/<2 random>/<phone>`), and validates the item
     (`verifyItem` — quantity and every part's `id/quantity/type` required).
   - Calls `CalculatedItemService.createCalculatedItem` to price every part.
3. Persists **in parallel**: the order row, the calculated item, and an audit
   trail "status changed" entry.
4. Returns a **`FullOrder`** = `{ order, calculatedItem (with part types),
   totals }`.

`updateOrderFromDto` is similar but preserves the original
`id/shortId/createdAt/status/location/amountPayed/notified/user/publicId`, and
logs a **full data-diff** audit entry instead of a status change. Note: an
update **re-creates** the order row (`repository.createOrder`) — there is no
partial patch for the item.

---

## 3. CalculatedItem — pricing the parts

`CalculatedItemService.createCalculatedItem(order, discount, extraParts)`:

1. Computes `OrderDimensions` once from the item
   (`CalculatedItemUtilities.getOrderDimensions`).
2. Prices each `PreCalculatedItemPart` **in parallel** via `calculatePart` →
   `PricingService.calculatePrice` (see [`pricing.md`](pricing.md)).
3. Appends any **`extraParts`** (manually-added lines, e.g. corners) verbatim.

A priced **`CalculatedItemPart`**:

```ts
{ priceId, price, quantity, discountAllowed, floating, description, log? }
```

`description` is derived per type by `getDefaultDescriptionByType` (e.g.
`"Cristal <id>"`, `"Trasera <id>"`, `"Passepartout <id>"`, `"Montaje <id>"`,
mold → `getMoldDescription`). A custom description overrides the default;
`extraInfo` is appended in parentheses.

The `CalculatedItem` (`{ orderId, discount, parts[], quantity }`) is persisted
separately from the order, keyed by `orderId`.

### Extra parts helper
`CalculatedItemUtilities.getCornersPricing(userMarkup)` builds the "Cantoneras"
(corner protectors) part at `2.5 €` (× markup if any), id `cantoneras_extra`.
`otherExtraId = 'other_extra'` tags generic manual lines.

---

## 4. Totals, discounts & payments

`OrderService.getTotals(calculatedItem)` (via
`CalculatedItemUtilities.calculatePartsCost`):

```
discountFactor      = applyDiscount ? (1 - discount/100) : 1
perPart             = price * quantity * (discountAllowed ? discountFactor : 1)
unitPrice           = ceil( Σ perPart(with discount)    * 100 ) / 100
unitPriceNoDiscount = ceil( Σ perPart(without discount) * 100 ) / 100
total               = unitPrice * item.quantity
totalWithoutDiscount= unitPriceNoDiscount * item.quantity
discountNotAllowedPresent = (some part has discountAllowed=false) && discount>0
```

- **Discount** is a percentage on the whole item, but parts flagged
  `discountAllowed = false` are **excluded** from the discount.
  `discountNotAllowedPresent` lets the UI warn that the discount didn't apply to
  everything.
- **`item.quantity`** multiplies the per-unit price for identical units.

`getTotalsForOrder` adds payment state:
- `remainingAmount = total - amountPayed`
- `payed = remainingAmount <= 0`

`getTotalsForExternalOrder` adds `markup` and
`totalWithoutMarkup = pricingService.calculatePriceWithoutMarkup(total)`.

### Payment operations
- `setOrderFullyPaid(order)` → `amountPayed = total`, logs a payment entry.
- `setOrderPartiallyPaid(order, amount)` → clamps `amount` to `[0, total]`
  (negative throws `InvalidDataError`), logs payment.

`PaymentStatus` (`FULLY_PAID | PARTIALLY_PAID | UNPAID`) is the enum the UI maps
to from these numbers.

---

## 5. Status transitions

| Method | Effect |
|---|---|
| `setOrderStatus(order, status, location?)` | Sets status + location; logs status and location changes. |
| `setOrderAsNotified(order)` | Marks `notified = true`; logs a notification entry. |
| `setOrderInvoiced(order, invoiced)` | Toggles `invoiced` (no audit entry). |
| `moveQuoteToOrder(order, deliveryDate)` | `QUOTE → PENDING`: resets `createdAt`, sets user + delivery date; logs. |
| `moveOrderToQuote(order)` | `* → QUOTE`: resets `createdAt`, delivery date → `31/12/9999`, clears `notified` and `amountPayed`; logs. |
| `addCustomerToTemporaryOrder(customer, order)` | Replaces the temp customer on a walk-in order. Throws if the order isn't temp. |

`OrderService.validateOrderId(id)` validates a UUID before any lookup.

---

## 6. Reads & queries

`OrderService` exposes many read paths, all of which hydrate the customer and
(for `FullOrder`) the calculated item + totals:

- By id: `getOrderById`, `getOrdersByIds`, `getFullOrderById`,
  `getFullOrdersByIds`.
- By public id: `getOrderIdByPublicId`.
- By status: `getOrdersByStatus`, `getStandaloneOrdersByStatus`,
  `getOrdersByStatusPaginated`, `findOrdersByStatus(status, query)` (text search
  via `SearchUtilities.normalizeString`).
- By customer: `getOrdersByCustomerId` (excludes quotes),
  `getOrdersByCustomerIdAndStatus`.
- Same-day grouping: `getOrdersOnSameDay`, `getOrdersCountOnSameDay`
  (`ISameDayOrderCounters` = finished/pending/total) — used to group a
  customer's orders made the same day.

`getFullOrders` batch-loads calculated items for a list of orders and zips them
with totals, attaching `PricingType` back onto each part
(`addTypesToCalculatedItem`) by matching `priceId` to the original
`partsToCalculate`.

---

## 7. Order sets

`OrderSetService` groups several of **one customer's** orders into a single set
(e.g. to print/share them together).

- `createOrderSet(orderIds)`: loads the full orders, **asserts they share one
  customer** (else throws), computes a deterministic **SHA-256 hash** of the
  sorted ids, and is **idempotent** — if a set with the same hash exists it is
  returned instead of creating a duplicate.
- `getOrderSetById(id)` rehydrates the set with its full orders.

The hash (sorted ids → `sha256`) is both the dedupe key and a stable identifier.

---

## 8. Audit trail

`OrderAuditTrailService` records every meaningful change, keyed by order, with
`userId/userName` and timestamp. Types (`OrderAuditTrailType`):
`STATUS`, `LOCATION`, `NOTIFICATION`, `PAYMENT`, `ATTACHMENT`, `DATA`.

- Simple entries store `oldValue`/`newValue` scalars (status, amount, location,
  file ref).
- **`DATA`** entries (`logOrderFullChanges`) store the entire old and new
  `Order` (serialised via `OrderService.toDto`). They are skipped if the order
  is unchanged (`JSON.stringify` equality) or the ids differ.
- All writes are **suppressed** when `config.disableOrderAuditTrail === true`,
  or when `newValue === oldValue`.
- `getEntriesForOrder(orderId, type?)` and
  `getEntriesForDayWithoutDataType(date)` (used by reporting) are the reads. The
  daily query intentionally excludes bulky `DATA` entries.

These status entries are the raw material the **daily report** mines to detect
"order became `PENDING` today" (see [`services.md`](services.md) → Reports).

---

## 9. The temp customer

Walk-ins without identification get a synthetic customer
(`OrderService.getTempCustomer`): id `temp-customer`, name `"Temp"`, phone
`+34612345678`. `OrderUtilities.isOrderTemp(order)` checks for it, and
`addCustomerToTemporaryOrder` later swaps in the real customer. Read paths
inject the temp customer into their customer maps so temp orders hydrate
correctly.
</content>
