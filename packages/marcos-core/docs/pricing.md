# Pricing engine

This is the heart of the package: how the price of a framing order is computed.
Everything here lives in three places:

- **`src/service/pricing.service.ts`** — orchestration: load a price entry,
  pick the right dimensions, apply the right formula, enforce limits, apply
  markup.
- **`src/data/static-pricing.ts`** — the pure formula functions (the actual
  maths) plus the `getMoldPrice` matrix lookup.
- **`src/utilities/pricing.utilites.ts`** — shared constants and helpers
  (`fabricIds`, formula groupings, crossbar helpers).

The price data itself lives in DynamoDB as **`ListPrice`** rows, one per
catalog entry (a specific mold, a glass type, a labour line, …). Mold rows are
bulk-loaded from an Excel file (see [Mold prices](#mold-prices-the-matrix--excel-loader)).

---

## 1. The vocabulary

### Pricing types — `PricingType` (`src/types/pricing.type.ts`)

Each part of an order belongs to exactly one pricing type. The type decides
**which dimensions** are used and **which pricing path** runs.

| Type | Meaning (Spanish UI) | Pricing path |
|---|---|---|
| `MOLD` | Moldura (frame) | Matrix lookup (`getMoldPrice`) |
| `FABRIC` | Estirar tela / Travesaño (stretch fabric / crossbar) | Special fabric path |
| `GLASS` | Cristal | Formula |
| `BACK` | Trasera (backboard) | Formula |
| `PP` | Passepartout (mat) | Formula |
| `LABOUR` | Montaje (assembly) | Formula |
| `TRANSPORT` | Transporte | Formula (usually `NONE`) |
| `HANGER` | Colgador | Formula (usually `NONE`) |
| `OTHER` | Otros | Formula (usually `NONE`) |

### Pricing formulas — `PricingFormula`

The formula tells the engine how to turn a base price + dimensions into a final
price. Used by every type **except** `MOLD` and `FABRIC`, which have dedicated
paths.

| Formula | Function | Idea |
|---|---|---|
| `FORMULA_LINEAR` | `linearPricing` | Price per metre of **perimeter** |
| `FORMULA_LINEAR_SHORT_SIDE` | `linearPricingShortSide` | Price per metre of the **short side** |
| `FORMULA_AREA` | `areaPricing` | Price per **m²** (raw) |
| `FORMULA_LEFTOVER` | `leftoverPricing` | m² price with waste factor **5** + tax |
| `FORMULA_LEFTOVER_12` | `leftoverPricing12` | same with waste factor **12** |
| `FORMULA_FIT_AREA` | `fitAreaPricing` | Step table: smallest `MaxArea` that fits |
| `FORMULA_FIT_AREA_M2` | `fitAreaM2Pricing` | Step table by m² (`MaxAreaM2`) |
| `NONE` | — | Flat price, returned as-is |

### `ListPrice` — a catalog entry

```ts
type ListPrice = {
  id: string;            // business id (e.g. mold reference "1234_ABC")
  internalId: string;    // UUID (persisted as `uuid`)
  price: number;         // base price; meaning depends on the formula
  minPrice: number;      // floor applied to the final computed price
  discountAllowed: boolean;
  description: string;   // Spanish, shown in UI
  type: PricingType;
  formula: PricingFormula;
  areas: MaxArea[];       // for FORMULA_FIT_AREA  → { d1, d2, price }
  areasM2: MaxAreaM2[];   // for FORMULA_FIT_AREA_M2 → { a, price }
  priority: number;
  floating: boolean;      // mold can be hung "floating"; informational flag
  maxD1?: number;         // max long side (cm) allowed
  maxD2?: number;         // max short side (cm) allowed
};
```

`price` is overloaded by formula: for `FORMULA_AREA`/`LEFTOVER*` it is a **price
per m²**; for `LINEAR*` a **price per metre**; for `MOLD` a **per-unit base**
multiplied by the matrix factor; for `NONE` the **final flat price**. For the
`FIT_AREA*` formulas `price` is forced to `0` and the price comes from the
`areas`/`areasM2` step table.

---

## 2. Dimensions — what the formulas actually receive

Computed in `CalculatedItemUtilities.getOrderDimensions`
(`src/utilities/calculated-item.utilites.ts`) from the order's `width`,
`height`, `pp`, and optional per-side `ppDimensions`.

```
OrderDimensions {
  originalWidth, originalHeight   // as entered
  totalWidth, totalHeight         // original + passepartout
  workingWidth, workingHeight     // total rounded UP to the next multiple of 5
}
```

- **Total** = original + passepartout border.
  - Uniform: `total = original + 2 * pp` on each axis.
  - Per side: `totalWidth = width + left + right`,
    `totalHeight = height + up + down`.
- **Working** = each total dimension rounded **up to the nearest multiple of 5**
  (`roundUpToNearestGreaterFiveOrTen`). A value already on a multiple of 5 is
  left unchanged. These are the dimensions used to cut material, hence used for
  molds.

### Which dimensions each path uses

`PricingService` normalises dimensions into an ordered `{ d1, d2 }` pair where
`d1 = max`, `d2 = min`:

- **Working dimensions** (`cleanAndOrderWorkingDimensions`) are **floored** to
  whole cm: `{ d1: floor(max), d2: floor(min) }`.
- **Total dimensions** (`cleanAndOrderTotalDimensions`) are **not** floored.

The mapping (`getDimensionsByType` / `getDimensionsByFormula`):

| Path | Dimensions used |
|---|---|
| `MOLD`, `FABRIC` | **Working** (floored) |
| `FORMULA_LEFTOVER`, `FORMULA_LEFTOVER_12` | **Working** (floored) |
| `FORMULA_FIT_AREA`, `FORMULA_FIT_AREA_M2`, `FORMULA_AREA`, `FORMULA_LINEAR`, `FORMULA_LINEAR_SHORT_SIDE`, `NONE` | **Total** (not floored) |

> Note: the fabric **crossbar** sub-case explicitly uses **total** dimensions
> even though `FABRIC` is otherwise a working-dimension type — see
> [Fabric & crossbar](#5-fabric--crossbar-pricing).

---

## 3. The pricing entry point — `calculatePrice`

```ts
calculatePrice(pricingType, orderDimensions, id, moldFabricId?) → {
  price, description, discountAllowed, floating
}
```

Steps:

1. **Load the price entry.**
   - `FABRIC` → `getFabricPriceList(...)` (special, see below).
   - otherwise → `getPriceFromListById(type, id)` which reads the DynamoDB row
     by `(type, id)` and **applies markup** (section 7).
2. **Enforce dimension limits** — `checkMaxMinDimensions` (section 6).
3. **Compute the raw price** — `getPriceByType` dispatches on `type`:
   - `MOLD` → `getMoldPrice`
   - `FABRIC` → `getFabricPrice`
   - everything else → `getPriceByFormula`
4. **Apply the floor**: `Math.max(rawPrice, minPrice)`.

The returned object carries `description`, `discountAllowed` and `floating`
through to the calculated part.

---

## 4. The formula functions (`static-pricing.ts`)

All maths is in pure functions. `defaultTax = 1.21` (21% IVA) is baked into the
leftover formulas. Unless stated otherwise, `d1`/`d2` are in **cm**.

### `linearPricing(mPrice, d1, d2)` — `FORMULA_LINEAR`
Perimeter in metres × price-per-metre, rounded up to cents.
```
((d1/100 + d2/100) * 2) * mPrice   → ceil to cents
```

### `linearPricingShortSide(mPrice, d1, d2)` — `FORMULA_LINEAR_SHORT_SIDE`
Short side in metres × price-per-metre, rounded up to cents.
```
(min(d1, d2) / 100) * mPrice        → ceil to cents
```

### `areaPricing(m2Price, d1, d2)` — `FORMULA_AREA`
Plain area in m² × price-per-m², rounded up to cents.
```
(d1/100) * (d2/100) * m2Price        → ceil to cents
```

### `leftoverPricing(m2Price, d1, d2)` / `leftoverPricing12(...)` — `FORMULA_LEFTOVER[_12]`
Area-based but with a **waste multiplier** (`5` or `12`), the **21% tax**, a
floor of 15 cm per side, and a flat **+2** handling charge. Rounded up to the
nearest **10 cents**.
```
d1m = max(15, d1);  d2m = max(15, d2)
((d1m/100) * (d2m/100) * m2Price * 1.21 * factor) + 2   → ceil to 0.1
```
`leftoverPricing` uses `factor = 5`; `leftoverPricing12` uses `factor = 12`.
These model materials sold in larger sheets where offcuts are wasted.

### `fitAreaPricing(listPrice, d1, d2)` — `FORMULA_FIT_AREA`
A **step table** of `MaxArea { d1, d2, price }` rows. The rows are sorted by
area, then perimeter (`sortByAreaAndPerimeter`); the engine returns the price of
the **first row that fully contains** the requested size (`row.d1 >= d1 &&
row.d2 >= d2`). If none fits → `InvalidSizeError` (Spanish message). Empty table
→ `InvalidSizeError`.

### `fitAreaM2Pricing(listPrice, d1, d2)` — `FORMULA_FIT_AREA_M2`
A step table of `MaxAreaM2 { a, price }` keyed by **area in m²**. The requested
area is `ceil((d1/100)*(d2/100) * 100)/100` (m², rounded up to cents). Rows are
sorted ascending by `a`; returns the price of the **first row whose `a >=`
requested area**. None fits / empty → `InvalidSizeError`.

### `NONE`
Returns `listPrice.price` unchanged (a flat price). Common for transport,
hangers and one-off "other" lines.

---

## 5. Fabric & crossbar pricing

Fabric is special: stretching a textile (`'fabric'`) is priced from working
dimensions, while a **crossbar** (`'fabric_long'` / `'fabric_short'`,
"travesaño") is priced from a referenced **mold's** base price and one of the
**total** dimensions.

Fabric ids (`PricingUtilites.fabricIds`):

```ts
fabricIds = { labour: 'fabric', short: 'fabric_short', long: 'fabric_long' }
```

### Loading the price entry — `getFabricPriceList(id, dims, moldFabricId?)`
- `id === 'fabric'` (labour) → returns the in-code `fabricDefaultPricing`
  entry ("Estirar tela", `NONE`, max 300×250). No DB lookup.
- otherwise (a crossbar) → `moldFabricId` is **required**. It loads the
  referenced **mold** price, then builds a synthetic `ListPriceWithMold` via
  `PricingUtilites.generateCrossbarPricing(...)`, whose description is
  `"Travesaño (<mold desc>) <dimension>cm"`. Markup is then applied.

### Computing the fabric price — `getFabricPrice(priceInfo, dims)`
- **Labour** (`id === 'fabric'`) → `getFabricPrice(d1, d2)` on **working** dims:
  ```
  ceil((0.0308 * (d1 + d2) + 1.95) * 10) / 10   // linear in (width+height), to 10 cents
  ```
- **Crossbar** → `getCrossbarPrice(moldPrice, dimension)` where `dimension`
  comes from **total** dims via `getFabricCrossbarDimension`:
  - `'fabric_long'` → uses `max(d1, d2)`
  - `'fabric_short'` (or other) → uses `min(d1, d2)`
  ```
  getCrossbarPrice(mPrice, d) = ceil(((d/100) * mPrice + 3) * 100) / 100
  ```
  i.e. the chosen side in metres × the mold's base price, **+3** flat, to cents.

---

## 6. Mold prices — the matrix + Excel loader

Molds do **not** use a formula. Their price is:

```
getMoldPrice(basePrice, d1, d2):
  factor = moldMatrix[ max(10, min(d1,d2)) ][ max(d1,d2, 15) ]
  return ceil(factor * basePrice * 100) / 100
```

- `moldMatrix` (`src/data/mold-matrix.ts`) is a 2-D lookup
  `Record<shortSide, Record<longSide, multiplier>>`. The **short side is clamped
  to ≥10 cm** and the **long side to ≥15 cm** before lookup.
- The multiplier grows with size (more linear metres + more waste for bigger
  frames). If a cell is missing the function throws `"Mold factor not found"`.
- `basePrice` is the per-mold catalog price (price per "unit" of the matrix),
  stored on the mold's `ListPrice` row.

Working dimensions (floored) are used.

### Excel bulk loader — `MoldPriceLoader` (`src/data/mold-price.loader.ts`)

Mold catalog prices are maintained in a spreadsheet, not hand-entered. The
loader:

1. `generateFileUploadUrl()` → a presigned S3 URL to upload an `.xlsx` into the
   `moldPricesBucket`.
2. `loadMoldPrices(fileName)`:
   - reads the **`TODAS`** sheet,
   - for each row: column **A** = internal id / location (UBI), **B** = external
     id, **C** = price, **D** = floating (`'S'` → `true`),
   - builds `ListPrice` rows with `id = "<A>_<B>"`, description
     `"<B> UBI: <A>"`, type `MOLD`, formula `NONE`, price ceil-ed to cents,
   - **deletes all existing mold prices and replaces them** with the new set
     (`deleteListPrices` then `batchStoreListPrices`).

The mold `id` encodes location + reference; `CalculatedItemUtilities.getMoldDescription`
splits it back into `"<reference> - UBI: <location>"` for display.

---

## 7. Markup (external orders)

`PricingService` is constructed with an optional `markup` percentage:

```ts
new PricingService(config, markup)   // markup stored internally as markup/100
```

When `markup > 0`, every price loaded from the catalog is inflated **before**
the formula runs, by `getPriceWithMarkup` / `calculateMarkup`:

```
calculateMarkup(p)            = round(p * (1 + markup) * 100) / 100
calculatePriceWithoutMarkup(p)= round((p / (1 + markup)) * 100) / 100
```

Markup is applied to `price`, `minPrice`, and every `areas[].price` /
`areasM2[].price`. With `markup === 0` the price object is returned untouched.

This is used for **external orders** (orders for non-walk-in / wholesale
contexts) where a percentage is layered over the base catalog. The factories
`ServiceFactory.createPricingServiceWithMarkup` /
`createCalculatedItemServiceWithMarkup` / `createOrderServiceWithMarkup` build a
fully-wired stack at a given markup. The external order's totals then expose
both `total` (with markup) and `totalWithoutMarkup` (back-computed via
`calculatePriceWithoutMarkup`). See [`orders.md`](orders.md).

---

## 8. Dimension limits & validation

### `checkMaxMinDimensions(orderDimensions, pricing)`
Run before computing every price.

- **Skipped** when `formula === NONE` **and** the type is in
  `noDimensionCheckPricingTypes` = `[OTHER, TRANSPORT, HANGER]` (these are size
  independent).
- Otherwise, if the entry has `maxD1`/`maxD2`, the relevant `{d1,d2}` (by type)
  is compared against the ordered max pair. If either side exceeds its max →
  **`InvalidSizeError`** with a Spanish message including the description, id and
  allowed `d1×d2`.

Molds are clamped at **300×265** (set in `cleanAndVerifyEntity`); the in-code
fabric labour entry caps at **300×250**.

### `cleanAndVerifyEntity(listPrice)` — write-time normalisation
Runs on `createPricing` / `updatePricing` / `batchStoreListPrices` before
persisting:

- `FORMULA_FIT_AREA` **requires** `areas`; `FORMULA_FIT_AREA_M2` **requires**
  `areasM2` (else throws).
- Non-fit formulas **require** a `price` (`price >= 0`, except `MOLD` may be
  negative); fit formulas force `price = 0` and clear the non-relevant
  area arrays.
- `MOLD` is forced to `maxD1 = 300`, `maxD2 = 265`, `formula = NONE`.

`fitFormulas = [FORMULA_FIT_AREA, FORMULA_FIT_AREA_M2]` is the canonical set
used for these branches.

---

## 9. Persistence of prices — `ListPricingRepositoryDynamoDb`

`ListPrice` ⇄ `ListPriceDto` (`{ uuid, id, type, formula, price, areas, … }`).
The table has a **GSI by `type`** (`ListPricingSecondaryIndexNames.Type`):

- `getByTypeAndId(type, id)` → the catalog entry for a part.
- `getByInternalId(uuid)` → by primary key (the UUID).
- `getAllPricesByType(type)` → the whole sub-catalog (e.g. all glass).
- `storeListPrice` / `batchStoreListPrices` **enforce id uniqueness** within a
  type: storing an `id` that already exists under a different `uuid` throws
  `InvalidKeyError`.
- `deleteListPrices(uuids)` → batch delete by primary key.

`PricingService.getPricingList(type)` / `getPriceListByInternalId(id)` are the
read APIs used by the back-office price-management screens, returning prices
**with markup applied** (markup is `0` for the normal store factory).

---

## 10. Worked example

A 50 × 70 cm picture, 5 cm passepartout all around, with a mold, glass, and
backboard.

1. **Dimensions** (`getOrderDimensions(70, 50, 5)`):
   - total = `(70 + 2·5) × (50 + 2·5)` = **80 × 60** (long × short after ordering).
   - working = round-up-to-5 of each = **80 × 60** (already multiples of 5).
2. **Mold** (base price say 4.00 €/unit): working ordered `{d1:80, d2:60}` →
   `factor = moldMatrix[60][80]` → `ceil(factor * 4.00 * 100)/100`.
3. **Glass** with `FORMULA_AREA` at 30 €/m², total dims `{80,60}`:
   `ceil((0.80 · 0.60 · 30) * 100)/100 = ceil(14.40) = 14.40 €`.
4. **Backboard** with `FORMULA_FIT_AREA`: the smallest configured `MaxArea`
   whose `d1 ≥ 80 && d2 ≥ 60` supplies the price.
5. Each result is floored by its own `minPrice`, markup is applied (0 for a
   normal store), and the three become **calculated parts** that the order's
   totals sum up (see [`orders.md`](orders.md)).
</content>
