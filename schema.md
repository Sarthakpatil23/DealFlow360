# DealFlow360 — Database Schema Design (schema.md)

This document is the complete data model for DealFlow360. It exists so that:
1. Every teammate understands exactly what tables/fields exist and why, before touching code.
2. An AI coding agent (Antigravity, or any other) can generate a correct, complete `schema.prisma` file from the prompt at the bottom, without guessing at field names or missing a relation.

This does not include DB setup/Docker steps, that's covered separately in `DB_Sync_Guide.md`. This is purely: what tables exist, what's in them, how they connect.

---

## Part 1: Schema Design Principles (decide these once, apply everywhere)

1. **Every table has an `id`, `createdAt`, `updatedAt`.** No exceptions. `id` uses `cuid()` (Prisma's default collision-resistant ID generator), not auto-increment integers, so IDs are safe to generate client-side too if ever needed.

2. **Money is never stored as `Float`.** Use Prisma's `Decimal` type for every price/amount/discount field. Floats introduce rounding errors (e.g., $0.1 + $0.2 not equalling $0.3 exactly), which is unacceptable for anything touching invoices or discounts.

3. **Percentages are stored as `Decimal` representing the actual percent number** (e.g., `12.00` means 12%), not as a fraction (`0.12`). Keeps every screen's display logic simple (no `* 100` scattered everywhere) and matches exactly how the wireframes show it ("12%", "18%").

4. **Controlled vocabularies are Prisma `enum`s, never free-text strings.** Role, Tier, Stage, RiskLevel, etc. This prevents typos like `"Aproved"` silently breaking a filter somewhere, and Prisma/TypeScript will catch mismatches at compile time.

5. **Nothing is ever hard-deleted from a live business record.** Products get an `isArchived` boolean instead of being deleted (old orders still need to reference them). Approval history, audit logs, and rejected quotations are never deleted, only new rows are appended. This directly matches the PS's explicit requirement: *"All approvals, rejections, and edits must be logged."*

6. **Configuration lives in the database, not in code.** Tier discount ceilings, category discount ceilings, and approval chain rules (Screen 18) are rows in tables, editable by Admin, not hardcoded constants. This matches the PS's explicit requirement: *"Core business rules must be implemented in application logic, not hardcoded or faked for the demo."*

7. **One-time and recurring billing are modeled as separate concepts**, not force-fit into one generic "line item" table, because they have fundamentally different lifecycles (Part 7 of the master spec: one-time bills on shipment, recurring bills on a cycle).

8. **Every foreign key gets an index.** Anything the app will filter or join on frequently (a customer's quotations, a warehouse's stock, an approver's queue) needs a database index, or list screens will slow down as demo data grows.

9. **Naming convention:** Models are `PascalCase` singular (`Quotation`, not `Quotations`). Fields are `camelCase`. Enum values are `SCREAMING_SNAKE_CASE` or simple `PascalCase`, pick one and stay consistent (this doc uses `PascalCase` for enum values, e.g. `Draft`, `PendingApproval`).

---

## Part 2: Enums

| Enum | Values | Used by |
|---|---|---|
| `UserRole` | `REP`, `MANAGER`, `FINANCE`, `ADMIN`, `CUSTOMER` | User.role |
| `CustomerTier` | `BRONZE`, `SILVER`, `GOLD` | Customer.tier |
| `ProductCategory` | `HARDWARE`, `SERVICES`, `SUBSCRIPTION` (extendable, Admin can add more later, but keep as enum for now per PS's fixed example categories) | Product.category |
| `RecurringCycle` | `WEEKLY`, `MONTHLY`, `YEARLY`, `QUARTERLY` | Product.recurringCycle, Subscription.cycle |
| `QuotationStage` | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `NEGOTIATION`, `CONFIRMED`, `REJECTED` | Quotation.stage |
| `RiskLevel` | `LOW`, `MEDIUM`, `HIGH` | Quotation.blendedRiskLevel |
| `ApprovalStepRole` | `SALES_MANAGER`, `FINANCE` | ApprovalStep.requiredRole |
| `ApprovalStepStatus` | `PENDING`, `APPROVED`, `RETURNED`, `REJECTED` | ApprovalStep.status |
| `AuditAction` | `SUBMITTED`, `RESUBMITTED`, `APPROVED`, `RETURNED_FOR_REVISION`, `REJECTED`, `CONFIG_CHANGED` | AuditLogEntry.action |
| `FulfillmentStatus` | `PENDING`, `SPLIT_PENDING`, `BACKORDER`, `FULFILLED` | Fulfillment.status |
| `SubscriptionStatus` | `ACTIVE`, `PAUSED`, `CANCELLED` | Subscription.status |
| `InvoiceType` | `ONE_TIME`, `RECURRING` | Invoice.type |
| `InvoiceStatus` | `UNPAID`, `PAID` | Invoice.status |
| `DealHealthAlertType` | `STALLED`, `DISCOUNT_ANOMALY`, `DELIVERY_SLIPPAGE` | DealHealthAlert.type |
| `DealHealthAlertAction` | `NONE`, `NUDGE_SENT`, `ESCALATED` | DealHealthAlert.actionTaken |

---

## Part 3: Models (full field-level breakdown)

### 3.1 `User`
Internal staff account (Rep, Manager, Finance, Admin). Customers are NOT stored here, see `CustomerUser` below, they're kept separate since customers only ever need portal-scoped access, never internal permissions.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| email | String | unique |
| passwordHash | String | bcrypt hash, never store plaintext |
| role | UserRole | REP / MANAGER / FINANCE / ADMIN |
| createdAt / updatedAt | DateTime | |

Relations: has many `Quotation` (as owning rep), has many `ApprovalStep` (as the approver who acted), has many `AuditLogEntry` (as actor).

### 3.2 `CustomerUser`
The login account for a customer's portal user. Kept separate from `User` because a customer should never accidentally get an internal role.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | unique |
| passwordHash | String | nullable if using magic-link only |
| customerId | String | FK → Customer |
| createdAt / updatedAt | DateTime | |

### 3.3 `Customer`
The business account being sold to (Acme Corp, Beta Industries, etc.).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| tier | CustomerTier | drives discount ceiling |
| preferredCurrency | String | e.g. "USD", "EUR" |
| createdAt / updatedAt | DateTime | |

Relations: has many `Quotation`, has many `CustomerUser`, has many `Subscription`, has many `Invoice`.

### 3.4 `Product`
Catalog item, matches Screen 16/17.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| category | ProductCategory | HARDWARE / SERVICES / SUBSCRIPTION |
| description | String | nullable |
| basePrice | Decimal | |
| unit | String | e.g. "Each", or "Recurring" |
| taxPercent | Decimal | |
| isSubscription | Boolean | default false |
| recurringCycle | RecurringCycle | nullable, only meaningful if isSubscription = true |
| quantityOnHand | Int | default 0, aggregate/reference figure; per-warehouse stock lives in `StockLevel` |
| isArchived | Boolean | default false, never hard-delete a product |
| createdAt / updatedAt | DateTime | |

Relations: has many `ProductVariantAttribute`, has many `PriceListEntry`, has many `StockLevel`, has many `OrderLine`, has many `UpsellRule` (as base or suggested product).

### 3.5 `ProductVariantAttribute`
One attribute row for a product (e.g., "Color" with values Blue/Black).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| productId | String | FK → Product |
| attributeName | String | e.g. "Color", "RAM", "Manufacturer" |
| createdAt / updatedAt | DateTime | |

Relations: has many `ProductVariantValue`.

### 3.6 `ProductVariantValue`
One selectable value under an attribute, with its extra price.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| variantAttributeId | String | FK → ProductVariantAttribute |
| value | String | e.g. "Blue", "8GB", "HP" |
| extraPrice | Decimal | default 0 |

### 3.7 `PriceListEntry`
Tier + currency specific price rule for a product (Screen 17's "Pricelists" table).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| productId | String | FK → Product |
| tier | CustomerTier | |
| currency | String | e.g. "USD" |
| priceAdjustmentPercent | Decimal | e.g. `-10.00` means "minus 10 percent base"; `0` means no adjustment |
| createdAt / updatedAt | DateTime | |

Unique constraint: (`productId`, `tier`, `currency`) should be unique, one rule per combination.

### 3.8 `TierDiscountCeiling`
Screen 18's "Tier Discount Ceilings" table. Admin-editable, not hardcoded.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| tier | CustomerTier | unique |
| maxDiscountPercent | Decimal | e.g. Bronze=5, Silver=10, Gold=15 |
| updatedAt | DateTime | |

### 3.9 `CategoryDiscountCeiling`
Screen 18's "Category Discount Ceilings" table.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| category | ProductCategory | unique |
| maxDiscountPercent | Decimal | e.g. Hardware=15, Services=10 |
| updatedAt | DateTime | |

### 3.10 `ApprovalChainThreshold`
Screen 18's "Discount range → who approves" table. Defines what overage amount counts as MEDIUM vs HIGH risk.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| riskLevel | RiskLevel | MEDIUM or HIGH (LOW needs no config, it's just "0 overage") |
| minOveragePoints | Decimal | e.g. MEDIUM starts at >0 points over, HIGH starts at, say, >=8 points over. Admin-configurable threshold. |
| requiredApprovalPath | String | descriptive, e.g. "SALES_MANAGER" or "SALES_MANAGER,FINANCE" — or model this as a related list of `ApprovalStepRole` in order, see note below |

> **Design note:** keep this simple for the hackathon: MEDIUM → one `ApprovalStep` required (`SALES_MANAGER`). HIGH → two `ApprovalStep`s required in order (`SALES_MANAGER` then `FINANCE`). This can be a fixed rule in code referencing this threshold table's `riskLevel`, rather than a fully dynamic workflow engine, that would be over-engineering for this project's scope.

### 3.11 `Warehouse`

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | e.g. "Main Warehouse", "East Depot" |
| shippingCostWeight | Decimal | lower = preferred/cheaper, used by the split algorithm |
| createdAt / updatedAt | DateTime | |

Relations: has many `StockLevel`, has many `FulfillmentLine`.

### 3.12 `StockLevel`
Per-warehouse, per-product stock (Screen 7's stock table).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| warehouseId | String | FK → Warehouse |
| productId | String | FK → Product |
| inStock | Int | |
| reserved | Int | default 0; `available` is a computed value (`inStock - reserved`), not stored, to avoid it going stale |
| updatedAt | DateTime | |

Unique constraint: (`warehouseId`, `productId`) unique.

### 3.13 `Quotation`
The central object (Q-1042 style). Matches Screens 3, 4, 6, 11.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| displayCode | String | unique, human-readable like "Q-1042" |
| customerId | String | FK → Customer |
| ownerRepId | String | FK → User (the sales rep) |
| stage | QuotationStage | DRAFT / PENDING_APPROVAL / APPROVED / NEGOTIATION / CONFIRMED / REJECTED |
| blendedRiskLevel | RiskLevel | nullable until first submit |
| currency | String | inherited from customer at creation, editable |
| lastActivityAt | DateTime | updated on every edit/comment/approval action, feeds the "stalled deal" check |
| createdAt / updatedAt | DateTime | |

Relations: has many `OrderLine`, has many `ApprovalStep`, has many `AuditLogEntry`, has many `NegotiationComment`, has one `Fulfillment`, has many `Subscription` (spun off from lines), has many `Invoice`.

### 3.14 `OrderLine`
One row inside a quotation (Screen 4's table).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | FK → Quotation |
| productId | String | FK → Product |
| variantSelectionJson | Json | nullable; stores which variant values were picked (e.g. `{"Color":"Black","RAM":"8GB"}`) |
| quantity | Int | |
| unitPrice | Decimal | snapshot at time of adding, price-list-adjusted, NOT a live reference, so historical orders don't change if prices update later |
| discountPercent | Decimal | manually entered by rep |
| effectiveLimitPercent | Decimal | computed at time of entry (stricter of tier ceiling vs category ceiling), stored for audit/history purposes even though it's derived |
| isUpsellAdd | Boolean | default false, true if this line was added via an upsell/cross-sell suggestion, useful for the "Top Upsold Product" report |
| createdAt / updatedAt | DateTime | |

### 3.15 `UpsellRule`
Screen 4's suggestion panel logic, and Admin's optional Screen (upsell rule setup mentioned in the PDF).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| baseProductId | String | FK → Product (the product being bought that triggers the suggestion) |
| suggestedProductId | String | FK → Product |
| isPromoted | Boolean | default false, promoted items rank higher |
| minMarginThreshold | Decimal | only suggest if margin impact clears this |
| createdAt / updatedAt | DateTime | |

### 3.16 `ApprovalStep`
One step in a quotation's approval chain (Screen 6's pipeline: Sales Manager, Finance).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | FK → Quotation |
| stepOrder | Int | 1 = first required approver, 2 = second, etc. |
| requiredRole | ApprovalStepRole | SALES_MANAGER or FINANCE |
| status | ApprovalStepStatus | PENDING / APPROVED / RETURNED / REJECTED |
| actedByUserId | String | nullable FK → User, filled in once someone acts |
| actedAt | DateTime | nullable |
| note | String | nullable, the reason text shown in the audit table |

### 3.17 `AuditLogEntry`
Screen 6's audit trail table. Append-only, never edited or deleted.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | nullable FK → Quotation (nullable so this table can also log config changes not tied to a quote, e.g. Admin editing Screen 18's thresholds) |
| actorUserId | String | FK → User |
| action | AuditAction | SUBMITTED / RESUBMITTED / APPROVED / RETURNED_FOR_REVISION / REJECTED / CONFIG_CHANGED |
| note | String | nullable |
| createdAt | DateTime | this IS the timestamp shown in the audit table, no separate updatedAt, this row is never updated |

### 3.18 `NegotiationComment`
Screen 11's line-level customer comments and counter-proposals.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | FK → Quotation |
| orderLineId | String | nullable FK → OrderLine (null if it's a general comment, not tied to one line) |
| authorCustomerUserId | String | nullable FK → CustomerUser |
| authorUserId | String | nullable FK → User (rep replying) |
| commentText | String | |
| counterDiscountPercent | Decimal | nullable |
| requestedDeliveryDate | DateTime | nullable |
| createdAt | DateTime | |

### 3.19 `Fulfillment`
One per quotation, holds overall fulfillment status (Screen 7/8).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | unique FK → Quotation, one-to-one |
| status | FulfillmentStatus | PENDING / SPLIT_PENDING / BACKORDER / FULFILLED |
| createdAt / updatedAt | DateTime | |

Relations: has many `FulfillmentLine`.

### 3.20 `FulfillmentLine`
Per warehouse, per product, per quotation: how much is being shipped from where (Screen 8's table).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| fulfillmentId | String | FK → Fulfillment |
| warehouseId | String | FK → Warehouse |
| productId | String | FK → Product |
| quantityFulfilled | Int | |
| estimatedShipments | Int | default 1 |
| estimatedCost | Decimal | nullable |
| isBackordered | Boolean | default false |
| shippedAt | DateTime | nullable, this is what unlocks invoicing for the corresponding one-time OrderLine |

### 3.21 `Subscription`
Screen 9/10's recurring plan record.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| customerId | String | FK → Customer |
| originatingOrderLineId | String | nullable FK → OrderLine (the line that spawned this subscription) |
| planName | String | e.g. "Care Plan 2yr" |
| cycle | RecurringCycle | |
| pricePerCycle | Decimal | current price, can change on upgrade/downgrade |
| nextBillDate | DateTime | nullable when paused |
| status | SubscriptionStatus | ACTIVE / PAUSED / CANCELLED |
| createdAt / updatedAt | DateTime | |

Relations: has many `Invoice` (recurring type).

### 3.22 `Invoice`
Screen 12/13's invoice records, covers both one-time and recurring.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| displayCode | String | unique, e.g. "INV-1042" |
| customerId | String | FK → Customer |
| quotationId | String | nullable FK → Quotation (set for one-time invoices) |
| subscriptionId | String | nullable FK → Subscription (set for recurring invoices) |
| type | InvoiceType | ONE_TIME or RECURRING |
| amount | Decimal | |
| status | InvoiceStatus | UNPAID or PAID |
| dueDate | DateTime | |
| paidAt | DateTime | nullable |
| createdAt | DateTime | |

### 3.23 `CreditNote`
Refunds/credits from proration or cancellation (Part 7 of the master spec).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| customerId | String | FK → Customer |
| subscriptionId | String | nullable FK → Subscription |
| amount | Decimal | |
| reason | String | e.g. "Mid-cycle cancellation refund" |
| createdAt | DateTime | |

### 3.24 `DealHealthAlert`
Screen 14's table.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quotationId | String | FK → Quotation |
| type | DealHealthAlertType | STALLED / DISCOUNT_ANOMALY / DELIVERY_SLIPPAGE |
| issueDescription | String | e.g. "Idle 9 days", "Discount 22% vs avg 8%" |
| flaggedAt | DateTime | |
| actionTaken | DealHealthAlertAction | NONE / NUDGE_SENT / ESCALATED |
| actionTakenAt | DateTime | nullable |

---

## Part 4: Key Relationships at a Glance

```
Customer 1───N Quotation 1───N OrderLine N───1 Product 1───N ProductVariantAttribute 1───N ProductVariantValue
                  │                                   │
                  │                                   └──1───N PriceListEntry
                  ├───N ApprovalStep
                  ├───N AuditLogEntry
                  ├───N NegotiationComment
                  ├───1 Fulfillment 1───N FulfillmentLine N───1 Warehouse 1───N StockLevel N───1 Product
                  ├───N Subscription 1───N Invoice
                  └───N Invoice

Customer 1───N CustomerUser
Customer 1───N Subscription 1───N CreditNote

TierDiscountCeiling, CategoryDiscountCeiling, ApprovalChainThreshold  ← Admin-configured, referenced by business logic, not directly foreign-keyed to Quotation
```

---

## Part 5: What This Schema Deliberately Leaves Out (and why)

- **No separate "Order" model apart from Quotation.** Per the master spec, a Quotation just changes `stage` to `CONFIRMED`, it doesn't become a different record type. Keeps the schema simpler and avoids duplicating all the same fields in two tables.
- **No generic "workflow engine" tables.** ApprovalStep is deliberately simple (ordered steps with a fixed set of two possible roles) rather than a fully dynamic rule engine, matches the actual complexity the PS asks for, not more.
- **No real payment gateway tables** (card details, transaction IDs from a processor). `Invoice.paidAt` + a manual "Record Payment" action is enough, per the offline/demo constraint already decided in `TechStack.md`.
- **No live currency exchange rate table.** Multi-currency is a bonus per the PS. If implemented, `Customer.preferredCurrency` plus a manually-set static rate is enough, no separate schema needed for it right now.

---

## Part 6: Prompt for Antigravity (paste this directly)

Copy everything inside the code block below into Antigravity as your prompt. It has enough detail to generate a complete, correct `schema.prisma` in one shot without needing back-and-forth.

```
You are generating a complete Prisma schema file (schema.prisma) for a project called DealFlow360, a B2B sales operations platform. The database is PostgreSQL, running locally.

Use this exact configuration at the top of the file:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

Follow these schema design principles strictly:
1. Every model has id (String, @id @default(cuid())), createdAt (DateTime @default(now())), and updatedAt (DateTime @updatedAt), unless explicitly noted otherwise below (AuditLogEntry only needs createdAt, not updatedAt, since it is append-only and never updated).
2. All money fields (prices, amounts, discounts) use Decimal, never Float or Int.
3. All percentage fields use Decimal representing whole percent numbers (12.00 means 12%), never fractions.
4. Use Prisma enums for every controlled vocabulary field, do not use plain String for status/role/type/category/tier/stage fields.
5. Add @@index on every foreign key field, and any field that will be frequently filtered (status, stage, type fields).
6. Add appropriate @@unique constraints where noted below.
7. Use PascalCase for model names (singular), camelCase for field names.
8. Add explicit relation names where a model has more than one relation to the same other model (e.g. User relates to Quotation as owner, and to ApprovalStep as actor, these need distinct relation names).

Generate the following enums exactly as specified:

enum UserRole { REP MANAGER FINANCE ADMIN }
enum CustomerTier { BRONZE SILVER GOLD }
enum ProductCategory { HARDWARE SERVICES SUBSCRIPTION }
enum RecurringCycle { WEEKLY MONTHLY QUARTERLY YEARLY }
enum QuotationStage { DRAFT PENDING_APPROVAL APPROVED NEGOTIATION CONFIRMED REJECTED }
enum RiskLevel { LOW MEDIUM HIGH }
enum ApprovalStepRole { SALES_MANAGER FINANCE }
enum ApprovalStepStatus { PENDING APPROVED RETURNED REJECTED }
enum AuditAction { SUBMITTED RESUBMITTED APPROVED RETURNED_FOR_REVISION REJECTED CONFIG_CHANGED }
enum FulfillmentStatus { PENDING SPLIT_PENDING BACKORDER FULFILLED }
enum SubscriptionStatus { ACTIVE PAUSED CANCELLED }
enum InvoiceType { ONE_TIME RECURRING }
enum InvoiceStatus { UNPAID PAID }
enum DealHealthAlertType { STALLED DISCOUNT_ANOMALY DELIVERY_SLIPPAGE }
enum DealHealthAlertAction { NONE NUDGE_SENT ESCALATED }

Generate the following models with these exact fields and relations:

User: id, name (String), email (String, unique), passwordHash (String), role (UserRole), createdAt, updatedAt.
  Relations: ownedQuotations (Quotation[], relation name "QuotationOwner"), approvalStepsActed (ApprovalStep[]), auditLogEntries (AuditLogEntry[]), negotiationReplies (NegotiationComment[]).

CustomerUser: id, email (String, unique), passwordHash (String, nullable), customerId (String, FK to Customer), createdAt, updatedAt.
  Relations: customer (Customer), negotiationComments (NegotiationComment[]).

Customer: id, name (String), tier (CustomerTier), preferredCurrency (String), createdAt, updatedAt.
  Relations: quotations (Quotation[]), customerUsers (CustomerUser[]), subscriptions (Subscription[]), invoices (Invoice[]), creditNotes (CreditNote[]).

Product: id, name (String), category (ProductCategory), description (String, nullable), basePrice (Decimal), unit (String), taxPercent (Decimal), isSubscription (Boolean, default false), recurringCycle (RecurringCycle, nullable), quantityOnHand (Int, default 0), isArchived (Boolean, default false), createdAt, updatedAt.
  Relations: variantAttributes (ProductVariantAttribute[]), priceListEntries (PriceListEntry[]), stockLevels (StockLevel[]), orderLines (OrderLine[]), fulfillmentLines (FulfillmentLine[]), upsellRulesAsBase (UpsellRule[], relation name "UpsellBase"), upsellRulesAsSuggestion (UpsellRule[], relation name "UpsellSuggestion").

ProductVariantAttribute: id, productId (FK to Product), attributeName (String), createdAt, updatedAt.
  Relations: product (Product), values (ProductVariantValue[]).

ProductVariantValue: id, variantAttributeId (FK to ProductVariantAttribute), value (String), extraPrice (Decimal, default 0).
  Relations: variantAttribute (ProductVariantAttribute).

PriceListEntry: id, productId (FK to Product), tier (CustomerTier), currency (String), priceAdjustmentPercent (Decimal), createdAt, updatedAt.
  Unique constraint on (productId, tier, currency).
  Relations: product (Product).

TierDiscountCeiling: id, tier (CustomerTier, unique), maxDiscountPercent (Decimal), updatedAt.

CategoryDiscountCeiling: id, category (ProductCategory, unique), maxDiscountPercent (Decimal), updatedAt.

ApprovalChainThreshold: id, riskLevel (RiskLevel), minOveragePoints (Decimal), requiredApprovalPath (String), updatedAt.

Warehouse: id, name (String), shippingCostWeight (Decimal), createdAt, updatedAt.
  Relations: stockLevels (StockLevel[]), fulfillmentLines (FulfillmentLine[]).

StockLevel: id, warehouseId (FK to Warehouse), productId (FK to Product), inStock (Int), reserved (Int, default 0), updatedAt.
  Unique constraint on (warehouseId, productId).
  Relations: warehouse (Warehouse), product (Product).

Quotation: id, displayCode (String, unique), customerId (FK to Customer), ownerRepId (FK to User, relation name "QuotationOwner"), stage (QuotationStage, default DRAFT), blendedRiskLevel (RiskLevel, nullable), currency (String), lastActivityAt (DateTime, default now), createdAt, updatedAt.
  Relations: customer (Customer), ownerRep (User), orderLines (OrderLine[]), approvalSteps (ApprovalStep[]), auditLogEntries (AuditLogEntry[]), negotiationComments (NegotiationComment[]), fulfillment (Fulfillment, one-to-one, nullable), subscriptions (Subscription[]), invoices (Invoice[]), dealHealthAlerts (DealHealthAlert[]).

OrderLine: id, quotationId (FK to Quotation), productId (FK to Product), variantSelectionJson (Json, nullable), quantity (Int), unitPrice (Decimal), discountPercent (Decimal), effectiveLimitPercent (Decimal), isUpsellAdd (Boolean, default false), createdAt, updatedAt.
  Relations: quotation (Quotation), product (Product), subscriptionsOriginated (Subscription[]).

UpsellRule: id, baseProductId (FK to Product, relation name "UpsellBase"), suggestedProductId (FK to Product, relation name "UpsellSuggestion"), isPromoted (Boolean, default false), minMarginThreshold (Decimal), createdAt, updatedAt.

ApprovalStep: id, quotationId (FK to Quotation), stepOrder (Int), requiredRole (ApprovalStepRole), status (ApprovalStepStatus, default PENDING), actedByUserId (FK to User, nullable), actedAt (DateTime, nullable), note (String, nullable).
  Relations: quotation (Quotation), actedByUser (User, nullable).

AuditLogEntry: id, quotationId (FK to Quotation, nullable), actorUserId (FK to User), action (AuditAction), note (String, nullable), createdAt (DateTime, default now, no updatedAt field on this model).
  Relations: quotation (Quotation, nullable), actorUser (User).

NegotiationComment: id, quotationId (FK to Quotation), orderLineId (FK to OrderLine, nullable), authorCustomerUserId (FK to CustomerUser, nullable), authorUserId (FK to User, nullable), commentText (String), counterDiscountPercent (Decimal, nullable), requestedDeliveryDate (DateTime, nullable), createdAt (DateTime, default now).
  Relations: quotation (Quotation), orderLine (OrderLine, nullable), authorCustomerUser (CustomerUser, nullable), authorUser (User, nullable).

Fulfillment: id, quotationId (FK to Quotation, unique, one-to-one), status (FulfillmentStatus, default PENDING), createdAt, updatedAt.
  Relations: quotation (Quotation), lines (FulfillmentLine[]).

FulfillmentLine: id, fulfillmentId (FK to Fulfillment), warehouseId (FK to Warehouse), productId (FK to Product), quantityFulfilled (Int), estimatedShipments (Int, default 1), estimatedCost (Decimal, nullable), isBackordered (Boolean, default false), shippedAt (DateTime, nullable).
  Relations: fulfillment (Fulfillment), warehouse (Warehouse), product (Product).

Subscription: id, customerId (FK to Customer), originatingOrderLineId (FK to OrderLine, nullable), planName (String), cycle (RecurringCycle), pricePerCycle (Decimal), nextBillDate (DateTime, nullable), status (SubscriptionStatus, default ACTIVE), createdAt, updatedAt.
  Relations: customer (Customer), originatingOrderLine (OrderLine, nullable), invoices (Invoice[]), creditNotes (CreditNote[]), quotation (Quotation, nullable, if you want to also link subscription directly back to the originating Quotation for convenience).

Invoice: id, displayCode (String, unique), customerId (FK to Customer), quotationId (FK to Quotation, nullable), subscriptionId (FK to Subscription, nullable), type (InvoiceType), amount (Decimal), status (InvoiceStatus, default UNPAID), dueDate (DateTime), paidAt (DateTime, nullable), createdAt (DateTime, default now).
  Relations: customer (Customer), quotation (Quotation, nullable), subscription (Subscription, nullable).

CreditNote: id, customerId (FK to Customer), subscriptionId (FK to Subscription, nullable), amount (Decimal), reason (String), createdAt (DateTime, default now).
  Relations: customer (Customer), subscription (Subscription, nullable).

DealHealthAlert: id, quotationId (FK to Quotation), type (DealHealthAlertType), issueDescription (String), flaggedAt (DateTime, default now), actionTaken (DealHealthAlertAction, default NONE), actionTakenAt (DateTime, nullable).
  Relations: quotation (Quotation).

Add @@index([customerId]), @@index([quotationId]) etc. on every model that has these foreign keys, to keep list-screen queries fast.

Output only the final, complete, valid schema.prisma file content. Do not include NextAuth's own Account/Session/VerificationToken models unless I explicitly ask for them separately, I will add those myself afterward since they follow a fixed template from the Auth.js Prisma adapter docs.
```

---

## Part 7: After Antigravity Generates the File

1. Save the output as `prisma/schema.prisma` in the repo.
2. Do not run any migration yet, per your plan, DB setup/Docker comes after this step.
3. Once DB setup is done (per `DB_Sync_Guide.md`), the first migration command to run is:
```bash
npx prisma migrate dev --name init
```
4. Immediately after that, write `prisma/seed.ts` using the Acme Corp / Q-1042 example data from the master spec doc, so every teammate starts from the same known-good sample data.