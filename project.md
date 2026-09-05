# DealFlow360 — Master Project Spec

This document is the single source of truth for what DealFlow360 does, screen by screen, rule by rule. It combines the original problem statement PDF with the 18 Excalidraw wireframes given alongside it. It does not cover tech stack or visual design (colors, fonts, layout polish) — those are separate decisions. This is purely: what exists, what happens, in what order, with what numbers.

Every module is explained twice: once as "what the screen shows and does," and once as "the underlying business rule that makes it work," with a worked numeric example wherever the logic could be ambiguous.

---

## Part 0: The Cast of Characters (used consistently in every example below)

To keep every example connected, we will follow **one deal from birth to payment** across the whole document:

- **Customer:** Acme Corp, tier = **Gold** (up to 15% discount allowed overall)
- **Quotation ID:** Q-1042
- **Sales Rep:** J. Rao
- **Sales Manager:** M. Shah
- **Finance Approver:** R. Iyer
- **Products on the quote:**
  - Laptop Pro 14 (Category: Hardware) — Qty 2, unit price $1,200
  - Onsite Setup Service (Category: Services) — Qty 1, unit price $450
  - Extended Warranty (Category: Services) — Qty 1, unit price $180
- **Warehouses:** Main Warehouse, East Depot
- **Subscription attached later:** Care Plan 2yr, $46/month billing

Other customers appear in list-screens as background/context (Beta Industries, Nova Retail, Zenith Co, Delta LLC, Orion Ltd) exactly as shown in the wireframes, to demonstrate what a populated list looks like.

---

## Part 1: Roles (who does what)

| Role | Can do |
|---|---|
| **Sales Rep** | Create/edit quotations, apply discounts, accept/dismiss upsell suggestions, submit for approval, view fulfillment and billing status, respond to customer negotiation. |
| **Sales Manager / Approver** | First-level approval on flagged quotations, configures discount tiers and approval chains, watches Deal Health dashboard, can escalate or nudge. |
| **Finance / Operations** | Second-level approval on high-risk discounts, manages warehouse fulfillment splits/backorders, reconciles recurring billing and credit notes. |
| **Customer (Portal User)** | Views their own quotation only, comments per line, submits a counter-discount, confirms the quote, requests a different delivery date. |
| **Admin** | Manages products, price lists, discount tiers, warehouses, subscription plans; views platform-wide analytics/reports. |

A single person can hold multiple roles (e.g., a small team's Admin might also be the Sales Manager) — the system does not force separate humans per role, it just requires separate **permissions** to exist.

---

## Part 2: The Core Data Concepts (explained in plain language, no schema/tech talk)

Before the screens make sense, you need to understand what "things" the system is tracking. Think of each of these as a **record type**, a category of thing the system remembers.

### 2.1 Customer
A business account. Has a name (Acme Corp), a **Tier** (Bronze/Silver/Gold), and a login (for portal access). Tier decides the customer's overall discount ceiling.

> **Design note:** The PS never says how a customer gets assigned a tier. This is left to you. Simplest approach: Admin manually sets/edits the tier on the customer record. (More advanced: auto-upgrade based on order history — optional, not required.)

### 2.2 Product
Something sellable. Has:
- Name (e.g., "Laptop Pro 14")
- Category (Hardware / Services / Subscription — categories matter because each category has its own discount ceiling)
- Base Price
- Unit (Each, or Recurring for subscriptions)
- Tax %
- Description
- **Subscription flag** (Yes/No) — if Yes, a Recurring cycle (Monthly/Yearly/Weekly) must be set
- **Quantity on hand** (an integer — how much exists, feeds into warehouse stock)

### 2.3 Product Variant
A product can have optional variation attributes, each with values and an extra price added on top of base price.

Example (Laptop Pro 14):
| Attribute | Values | Extra Price |
|---|---|---|
| Color | Blue, Black | +$0 |
| RAM | 4GB, 8GB | +$30 |
| Manufacturer | Dell, HP | +$10 / +$30 |

So "Laptop Pro 14, Black, 8GB RAM, HP" = $1,200 (base) + $0 (Black) + $30 (8GB) + $30 (HP) = **$1,260**.

### 2.4 Price List
A rule that changes a product's price depending on customer **Tier** and **Currency**.

Example:
| Tier | Currency | Price Rule |
|---|---|---|
| Bronze | USD | Price, no adjustment |
| Gold | USD/EUR | Price minus 10 percent base |

So the *same* Laptop Pro 14 costs less for a Gold customer even *before* any manual discount is applied, because the price list itself already gives Gold a 10% break off the base price. (This is separate from, and stacks before, the *manual discount* a rep applies on the quote.)

### 2.5 Discount Tier Ceiling
The maximum manual discount % a rep can apply, based on the *customer's* tier, before triggering approval.

| Tier | Max Discount |
|---|---|
| Bronze | 5% |
| Silver | 10% |
| Gold | 15% |

### 2.6 Category Discount Ceiling
The maximum manual discount % allowed for a *specific product category*, regardless of customer tier. This exists because some categories have thinner margins than others.

| Category | Max Discount |
|---|---|
| Hardware | 15% |
| Services | 10% |

**Important:** Both ceilings apply simultaneously. A line is only "OK" if it respects **both** its customer tier's ceiling AND its category's ceiling. In practice, the system checks the **stricter (lower)** of the two for that line, live, as it's entered.

### 2.7 Approval Chain Rule
Decides who must sign off, based on how far a quote's discount goes over its allowed limit.

| Situation | Who approves |
|---|---|
| Discount within tier/category limit | No approval needed (auto-approved) |
| Over limit, blended risk = MEDIUM | Sales Manager |
| Over limit, blended risk = HIGH | Sales Manager, then Finance |

### 2.8 Blended Discount Risk Score
A calculated value (LOW / MEDIUM / HIGH) that looks at **every line** in the quote against its own limit, not just the overall order discount. Full worked explanation in Part 4.

### 2.9 Warehouse
A physical stock location. Has a name (Main Warehouse, East Depot), current stock per product, and a shipping-cost weighting used to decide how orders should be split when one warehouse can't fulfill everything alone.

### 2.10 Stock Record
Per warehouse, per product: **In Stock**, **Reserved** (already promised to other unconfirmed/confirmed orders), **Available** (In Stock minus Reserved — this is the number actually usable for a *new* fulfillment decision).

### 2.11 Quotation (a.k.a. Deal, a.k.a. Order once confirmed)
The central object. Has:
- A Customer
- A Price List (based on customer tier + currency)
- A list of **Order Lines** (product, qty, unit price, discount %, category limit, line status)
- A **Stage**: Draft → Pending Approval → Approved → Negotiation → Confirmed (these map directly to the Kanban columns in Screen 3)
- A **Blended Risk Score**
- An **Approval history** (who approved/rejected/returned, when, why)
- A **Fulfillment record** (warehouse split)
- Any **Subscription lines** attached (which spin off their own billing schedule)
- Linked **Invoices**

### 2.12 Order Line
One row inside a quotation: Product, Qty, Unit Price, Discount % given, Limit % allowed (the *stricter* of tier-ceiling and category-ceiling), Status (OK / OVER by +N points).

### 2.13 Approval Record
A single log entry: who acted (rep or approver), what action (Submitted / Approved / Rejected / Returned for Revision / Resubmitted), when, and a free-text note/reason. This is the **audit trail** — it is never deleted or overwritten, only appended to.

### 2.14 Subscription
A recurring plan attached to a customer (born from an order line that was flagged "Subscription"). Has: Plan name, Cycle (Monthly/Quarterly/Yearly), Next Bill Date, Status (Active/Paused/Cancelled), and its own billing history.

### 2.15 Invoice
A bill generated either from a one-time order line (billed once, at shipment) or from a subscription's billing cycle (billed automatically every cycle). Has: Invoice #, Customer, Amount, Status (Unpaid/Paid), Due Date. Linked back to the order/subscription that generated it.

### 2.16 Deal Health Alert
An automatically generated flag on a quotation: "Idle X days" (stalled), "Discount N% vs avg M%" (anomaly), or a delivery-promise slippage warning. Each alert has an action taken against it (Nudge sent / Escalated to Manager).

---

## Part 3: Screen-by-Screen Walkthrough

Each screen below is described as: **Purpose → What's on it → What each action does → Where it goes next.**

---

### Screen 1 — Login / Signup
**Purpose:** Single entry point for both internal staff and customers.

**What's on it:**
- Toggle: Log In / Sign Up
- Email field, Password field
- "Log In" button, "Forgot Password?" link
- A banner explaining: after login, internal users land on the **Sales Dashboard**; customers land on their **Quotation Portal** (different destinations from the same login screen)

**Rules:**
- Basic validation on email/password fields (format, non-empty).
- If the account belongs to an org with multiple sales teams, a **Company/Team selector** is shown so the user picks which workspace to enter.
- "Sign Up" creates either a new internal account (rep/manager/finance/admin, subject to whoever provisions it) or a new customer account (typically customers are invited via a magic link rather than self-registering, but the screen supports manual signup too).

**Where it goes:** Internal user → Screen 2 (Sales Dashboard). Customer → Screen 11 (Customer Portal Negotiation Screen), scoped only to their own quotation(s).

---

### Screen 2 — Sales Dashboard
**Purpose:** The home base for every internal user. A jumping-off point to every other module.

**What's on it:**
- Top navigation bar present on every internal screen from here on: **Dashboard, Quotations, Approvals, Fulfillment, Subscriptions, Invoices, Deal Health, Reports, Product**
- Three summary cards:
  - **Pending Approvals** — count of quotes waiting on someone (e.g., "4 quotations waiting")
  - **Open Quotations** — count of active deals still in progress (e.g., "12 active deals")
  - **At-Risk Deals** — count flagged by the Deal Health engine (e.g., "3 flagged by Deal Health")
- Buttons: **+ New Quotation** (jumps straight into a blank Quotation Builder), **View Approvals** (jumps to Screen 5)
- **Recent Activity** feed, a running log of the latest events across the whole system, e.g.:
  - "Acme Corp quotation approved by Finance"
  - "Beta Industries requested a discount change"
  - "East Depot stock updated for Order #2291"

**Rule:** This screen is read-mostly. It does not let you edit anything directly, it routes you everywhere else. Every card and feed item is clickable and deep-links to the relevant detail screen (e.g., clicking "Acme Corp quotation approved by Finance" opens that quotation's Approval Detail screen).

---

### Screen 3 — Quotations List (Pipeline / Kanban View)
**Purpose:** See every deal in the system, grouped by stage, at a glance.

**What's on it:** Five columns, one per stage, each holding cards for quotations currently in that stage:

| Draft | Pending Approval | Approved | Negotiation | Confirmed |
|---|---|---|---|---|
| Acme Corp — $12,400 | Beta Industries — $28,900 | Nova Retail — $9,750 | Zenith Co — $15,300 | Orion Ltd — $41,000 |
| Delta LLC — $3,200 | | | | |

Buttons: **+ New Quotation**, **Switch to Table View** (same data, spreadsheet-style rows instead of cards, for people who prefer scanning a table).

**Rule — the five stages, defined precisely:**
1. **Draft** — rep is still building it, nothing submitted yet. Fully editable.
2. **Pending Approval** — submitted, blended risk pushed it into the approval chain, sitting with a specific approver right now.
3. **Approved** — cleared all required approvals (or never needed any), ready to move to fulfillment/billing.
4. **Negotiation** — sent to the customer, customer is actively commenting/countering in their portal.
5. **Confirmed** — customer clicked "Confirm Quotation" and (if needed) any final re-approval also cleared; now a real order proceeding to fulfillment and billing.

**Rule:** A card only moves columns automatically when a triggering action happens elsewhere (submit, approve, customer confirms) — nobody manually drags cards to fake progress; the system enforces the stage.

**Where it goes:** Clicking any card opens that quotation's **Quotation Detail** screen (Screen 4), regardless of which column it's in — the detail screen shows the right controls for wherever that quote currently sits.

---

### Screen 4 — Quotation Detail / Builder (Q-1042, Acme Corp)
**Purpose:** Where a rep actually builds the deal, line by line.

**What's on it:**
- Customer field, Price List field (auto-populated from the customer's tier + chosen currency, per Part 2.4)
- The line-item table:

| Product | Qty | Price | Discount | Limit | Status |
|---|---|---|---|---|---|
| Laptop Pro 14 | 2 | $1,200 | 12% | 15% | OK |
| Onsite Setup Service | 1 | $450 | 18% | 10% | **OVER (+8pt)** |
| Extended Warranty | 1 | $180 | 10% | 15% | OK |

- A live banner: *"Discount is checked against each line's own limit live, as soon as it is entered, not only at submit time."*
- **Upsell and Cross-Sell Suggestions** panel, shown alongside the cart while building:
  - **+ Wireless Mouse** — Margin +$18
  - **+ Docking Station** — Promo: 12% off
  - **+ Care Plan 2yr** — Margin +$46
- Buttons: **Save Draft**, **Submit for Approval**

**Rule — how "Limit" is decided per line:** For each line, take the customer's tier ceiling (Gold = 15%) and the product's category ceiling (Hardware = 15%, Services = 10%), and use the **stricter (smaller)** number as that line's Limit.
- Laptop Pro 14: Hardware category limit = 15%, Gold tier limit = 15% → Limit shown = 15%. Given 12% → OK.
- Onsite Setup Service: Services category limit = 10%, Gold tier limit = 15% → Limit shown = 10% (the stricter one wins). Given 18% → 8 points OVER.
- Extended Warranty: Services category limit = 10%. Given only 10%... wait, but the wireframe shows this line's Limit as 15% and status OK at 10% given. This tells us Extended Warranty is *not categorized under Services' 10% ceiling* in this particular seed data (it may sit under a "Warranty/Hardware-adjacent" category with a 15% ceiling, or it is treated as bundled with Hardware). **Design takeaway: category assignment happens per-product, not per-word-in-the-name — always check the product's actual assigned category, don't assume from the product's label.**

**Rule — checking is live, not just at submit:** As soon as a rep types a discount % into any line, the system immediately looks up that line's limit and marks it OK or OVER right there. The rep sees the problem before they even try to submit.

**Rule — Upsell/Cross-sell suggestion logic:**
- Suggestions are ranked using historical co-purchase data (what other customers who bought a Laptop Pro 14 also bought).
- Only products above the Admin-configured **minimum margin threshold** (Part 2 / Screen setup) are shown, so the system never suggests something that would sell at an unhealthy margin.
- Promoted products (marked by Admin) rank higher and show a "Promo" tag.
- Clicking **Add to Quote** on a suggestion inserts it as a new order line immediately, and the order's live margin indicator updates instantly (no page reload, no waiting for approval).
- Clicking **Dismiss** just removes it from the suggestion panel for this session; it does not blacklist the product for future quotes.

**Rule — what "Submit for Approval" actually does:**
1. Freeze the line-item data (can't be silently edited once submitted; further edits require Return for Revision first).
2. Calculate the **Blended Discount Risk Score** across all lines (see Part 4).
3. If LOW (no line over limit, or negligible pattern): the quote auto-approves and jumps straight to **Approved** stage, no human needed.
4. If MEDIUM or HIGH: quote moves to **Pending Approval** and a new Approval Record ("Submitted") is logged, then the quote appears on the relevant approver's queue (Screen 5).

**Where it goes:** Submit → Screen 5/6 (Approvals). Save Draft → stays on Screen 3 under "Draft".

---

### Screen 5 — Approvals List
**Purpose:** Every quote that needed, needs, or is currently going through discount approval, in one queue.

**What's on it:**
- Three status pill counters: **3 Pending**, **1 Returned**, **12 Approved**
- Table:

| Quotation | Customer | Blended Risk | Stage | Assigned To |
|---|---|---|---|---|
| Q-1042 | Acme Corp | HIGH | Sales Manager | M. Shah |
| Q-1039 | Beta Industries | MEDIUM | Finance | R. Iyer |
| Q-1035 | Nova Retail | LOW | Auto-Approved | — |

- Filter toggle: **Pending Only**

**Rule:** Even LOW/Auto-Approved quotes show up here (for visibility/audit), but they carry no action needed and no assignee. Only MEDIUM and HIGH actually sit in someone's queue with real work to do.

**Rule — "Assigned To":** Determined automatically by the Approval Chain Rule (Part 2.7): MEDIUM risk → whoever is configured as Sales Manager for that team; HIGH risk → Sales Manager first, and once *they* approve, it automatically re-assigns to Finance next (the row would update its "Stage"/"Assigned To" the moment the Manager acts, without the rep or the quote needing to be resubmitted).

**Where it goes:** Clicking any row → Screen 6 (Approval Detail) for that specific quote.

---

### Screen 6 — Approval Detail (Q-1042, Acme Corp)
**Purpose:** Give the approver everything they need to decide, plus a full paper trail.

**What's on it:**
- Two badges: **Blended Risk: HIGH**, **Customer Tier: Gold**
- **"Why This Quote Was Flagged"** table, the exact same per-line breakdown as Screen 4, but now frozen/read-only for the approver:

| Line | Discount Given | Limit Allowed | Over By |
|---|---|---|---|
| Laptop (Hardware) | 12% | 15% | 0pt, OK |
| Setup Service (Services) | 18% | 10% | **8pt OVER** |

- Explanatory banner: *"Worst single line (8pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require approval."*
- A visual **approval pipeline**: `Submitted (done) → Sales Manager (current) → Finance (pending, greyed) → Confirmed (pending, greyed)`
- **Audit trail** table (this never gets edited, only appended to):

| User | Action | Date | Note |
|---|---|---|---|
| J. Rao | Submitted | Aug 20 | Initial 12% discount |
| M. Shah | Returned | Aug 21 | Requested justification |
| J. Rao | Resubmitted | Aug 22 | Added margin note |

- Three buttons: **Approve**, **Return for Revision**, **Reject**

**Rule — what each button does:**
- **Approve** → logs a new audit entry ("M. Shah, Approved, [today], [optional note]"). If this was the *last* required approver (e.g., risk was MEDIUM and Sales Manager is the only required approver), the quote moves to **Approved** stage and proceeds to fulfillment (Screen 7). If risk was HIGH and this was the Sales Manager step, the quote does **not** move to Approved yet, instead the pipeline advances to "Finance (current)" and it now appears in Finance's queue (R. Iyer) on Screen 5.
- **Return for Revision** → logs "Returned" with the approver's reason (e.g., "Requested justification"), quote goes back to **Draft** stage, editable again by the rep. The rep fixes something (discount, note, whatever) and hits Submit for Approval again, which logs "Resubmitted" and re-enters the same approval step it left from (it does not need to restart from zero, unless the discount was changed enough to change the blended score, in which case the score is recalculated from scratch).
- **Reject** → logs "Rejected", quote is marked dead (does not silently disappear, it stays visible in history/reporting as a rejected deal for record-keeping, but drops out of the active pipeline).

**Rule — why one 8-point-over line is enough to flag the whole order (repeated from the banner, because it's the single most important rule in this project):** The blended score doesn't average things out to make one bad line "disappear" into a good overall number. A quote is judged on its riskiest behavior, not its nicest-looking behavior. See Part 4 for the full math.

**Where it goes:** Approve (final step) → Screen 7. Approve (mid-chain) → stays in Screen 5 queue, reassigned. Return → Screen 4 (editable draft). Reject → back to Screen 3, in a rejected/dead state.

---

### Screen 7 — Fulfillment and Stock (List)
**Purpose:** Live view of stock across every warehouse, plus every order still needing to be shipped.

**What's on it:**
- Stock table:

| Warehouse | Product | In Stock | Reserved | Available |
|---|---|---|---|---|
| Main Warehouse | Laptop Pro 14 | 40 | 18 | 22 |
| East Depot | Laptop Pro 14 | 10 | 6 | 4 |
| Main Warehouse | Docking Station | 65 | 12 | 53 |

- **Orders Awaiting Fulfillment** table:

| Order | Customer | Status | Warehouses |
|---|---|---|---|
| Q-1042 | Acme Corp | Split Pending | Main + East Depot |
| Q-1030 | Zenith Co | Backorder | East Depot |

**Rule — Reserved vs Available:** "Reserved" is stock already promised to other orders that haven't shipped yet (so it's not free to give away again). "Available" = In Stock minus Reserved. Every warehouse-split decision only ever looks at "Available," never raw "In Stock," to avoid double-promising the same units to two different customers.

**Rule — "Split Pending" vs "Backorder":** Split Pending means the order *can* be fully fulfilled, just needs stock pulled from more than one warehouse. Backorder means even *combined across all warehouses*, there isn't enough Available stock to fully cover the order right now, so part of it must wait for restock.

**Where it goes:** Clicking any order row → Screen 8 (Fulfillment Detail for that specific order).

---

### Screen 8 — Fulfillment Detail (Q-1042, Acme Corp)
**Purpose:** Show exactly how one order's stock will be pulled and shipped.

**What's on it:**

| Warehouse | Qty Fulfilled | Est. Shipments | Cost |
|---|---|---|---|
| Main Warehouse | 18 units | 1 | (shown) |
| East Depot | 6 units | 1 | $29 |

- Banner: *"'Consolidate Remaining Backorder' prompt appears automatically once East Depot restocks."*
- Buttons: **Accept Suggested Split**, **Manual Override**

**Rule — how the system decides the split (the algorithm, in plain terms):**
1. Look at total quantity needed for each product on the order.
2. Try to fulfill entirely from a single warehouse first, preferring the warehouse with the lowest configured shipping-cost weighting (Part 2.9), to minimize number of shipments and cost.
3. If no single warehouse has enough **Available** stock, split: pull as much as possible from the cheapest/preferred warehouse, then pull the remainder from the next warehouse, and so on, until the order is either fully covered or stock runs out everywhere.
4. Anything still short after checking every warehouse becomes a **Backorder** line, held until restock.
5. Present this computed plan to the user as the "Suggested Split." They can **Accept** it as-is, or hit **Manual Override** to manually reassign quantities warehouse-by-warehouse themselves (for cases like "I know Main Warehouse's stock count is stale, actually ship all of it from East Depot").

**Rule — Consolidate Remaining Backorder:** If part of an order was backordered and that warehouse later gets restocked, the system automatically detects this and prompts: "want to ship the remaining units now, consolidated into one shipment?" instead of silently trickling out lots of tiny shipments. This is a proactive, automatic prompt, not something the ops user has to remember to go check for.

**Where it goes:** Once fulfillment is accepted, the order lines are marked shipped/fulfilled (feeding into Screen 13, the Invoice Detail timeline).

---

### Screen 9 — Subscriptions (List)
**Purpose:** Every recurring plan across every customer, in one place, regardless of which original order it came from.

**What's on it:**
- Three status pills: **18 Active**, **2 Paused**, **3 Cancelled**
- Table:

| Customer | Plan | Cycle | Next Bill | Status |
|---|---|---|---|---|
| Acme Corp | Care Plan 2yr | Monthly | Sep 15 | Active |
| Beta Industries | Support SLA | Quarterly | Nov 1 | Active |
| Delta LLC | Care Plan 1yr | Monthly | — | Paused |

- Button: **+ New Plan (Admin)** — lets Admin manually create a subscription record directly (useful for renewals, manual corrections, or plans not originating from a quotation).

**Rule:** A subscription's existence is normally *born* from an order line where the product had "Subscription: Yes" (Screen 17). It is not a separate thing a rep has to manually set up twice, once the order confirms, the subscription record is generated automatically with its cycle and first Next Bill Date pulled straight from the product's configuration.

**Rule — Paused subscriptions:** Shown with a dash for Next Bill Date, because billing is suspended, nothing gets charged while paused, and it doesn't get invoiced again until resumed.

**Where it goes:** Clicking a row → Screen 10 (Billing Detail for that specific subscription).

---

### Screen 10 — Billing Detail (Acme Corp, Care Plan 2yr)
**Purpose:** See exactly what's one-time vs recurring for this customer's order, and manage the subscription itself.

**What's on it:**
- **One-Time Lines (from originating order):**

| Product | Qty | Amount |
|---|---|---|
| Laptop Pro 14 | 2 | $2,280 |
| Onsite Setup | 1 | $450 |

- **Recurring Lines:**

| Plan | Cycle | Next Bill Date | Amount |
|---|---|---|---|
| Care Plan 2yr | Monthly | Sep 15 | $46 |
| Support SLA | Quarterly | Nov 1 | $300 |

- Buttons: **Modify Subscription**, **Cancel Subscription**

**Rule — why one-time and recurring are shown as two separate tables, not merged:** They have fundamentally different billing timing. One-time lines get billed once, tied to shipment (see Screen 13's rule: "nothing is billed before it ships"). Recurring lines get billed automatically every cycle, forever, until paused/cancelled, regardless of shipment status. Merging them into one table would hide this difference and cause billing mistakes.

**Rule — Modify Subscription and proration:** If a customer changes quantity or plan mid-cycle (say, upgrades on day 15 of a 30-day monthly cycle), the system does **not** charge/refund the full cycle amount. It prorates:

> **Proration formula:** `New charge for remainder of cycle = (New plan price − Old plan price) × (days remaining in cycle ÷ total days in cycle)`

**Worked example:** Care Plan 2yr costs $46/month. Say on day 15 of a 30-day month, Acme Corp upgrades to a $76/month plan.
- Difference in price: $76 − $46 = $30
- Days remaining: 30 − 15 = 15
- Proration fraction: 15/30 = 0.5
- Extra charge for this cycle: $30 × 0.5 = **$15**
- Acme Corp is billed $15 extra this cycle (not the full $30), and from the *next* cycle onward, they're billed the full $76.

**Rule — Cancel Subscription:** Cancelling stops all future billing. If the customer already paid for time they won't use (e.g., cancelled mid-cycle on a plan paid up front), the system automatically triggers a **partial refund or credit note** for the unused portion, using the same proration math in reverse.

**Where it goes:** Modify/Cancel actions update the subscription's status and Next Bill Date shown back on Screen 9, and generate any resulting invoice/credit note that appears on Screen 12.

---

### Screen 11 — Customer Portal Negotiation Screen
**Purpose:** The customer's own restricted view. This is a genuinely separate, locked-down screen, not the internal workspace with a different skin.

**What's on it:**
- Top nav (customer-scoped only): **My Quotation, Messages, Profile**
- Status pill: **Under Negotiation**
- Line-level comment table:

| Line | Customer Comment |
|---|---|
| Extended Warranty | "Can this be 15% off instead of 10%?" |
| Onsite Setup | "Can we push this to next month?" |

- Fields: **Counter Discount %**, **Requested Delivery Date**
- Buttons: **Submit Request**, **Confirm Quotation**
- Banner: *"If final terms exceed thresholds, the quote automatically re-enters approval (Screen 6)."*

**Rule — what the customer can and cannot do:** They can only see and act on **their own** quotation. No visibility into internal margin numbers, no visibility into other customers' deals, no access to backend configuration. They can comment per line, propose a different discount %, and propose a different delivery date, that's the entire surface area available to them.

**Rule — Submit Request vs Confirm Quotation:**
- **Submit Request** sends their comments/counter-proposal back to the rep for a human response (does not itself change any pricing, it's a message).
- **Confirm Quotation** is the customer accepting a specific version of the quote as final. This is the only action that actually changes the quote's stage.

**Rule — automatic re-approval on confirm (this is the important one):** When the customer hits **Confirm Quotation**, the system checks the *final* agreed terms (including any counter-discount that was actually applied by the rep in response to their request) against the same discount limits from Part 2.6/2.7.
- If final terms are within limits → quote moves straight to **Confirmed** stage, proceeds to fulfillment/billing.
- If final terms exceed the limits (e.g., the rep agreed to bump Extended Warranty's discount from 10% to 15%, which is fine under its 15% limit... but if instead they'd agreed to push it to 20%, that's now over-limit) → the quote automatically re-enters the approval flow from **Screen 6**, exactly as if it were being submitted fresh. Nobody has to remember to manually re-check it, the system does this check on every confirmation, every time, with no exceptions.

**Where it goes:** Confirm (within limits) → Screen 7 (Fulfillment) + Screen 9/10 (Subscription billing spins up) start in parallel. Confirm (over limits) → back to Screen 6 (Approval Detail), reusing the exact same approval-chain machinery as a first-time submission.

---

### Screen 12 — Invoices (List)
**Purpose:** Every invoice generated from either one-time or recurring orders, across the whole business.

**What's on it:**
- Two status pills: **4 Unpaid**, **21 Paid**
- Table:

| Invoice # | Customer | Amount | Status | Due Date |
|---|---|---|---|---|
| INV-1042 | Acme Corp | $2,730 | Unpaid | Sep 10 |
| INV-1043 | Acme Corp | $46 | Paid | Sep 15 |
| INV-1038 | Nova Retail | $9,750 | Paid | Aug 30 |

**Rule:** INV-1042 ($2,730) is the *one-time* invoice, generated from the Laptop + Onsite Setup lines once they shipped. INV-1043 ($46) is a *recurring* invoice, automatically generated the moment the Care Plan 2yr subscription's billing cycle hit its Next Bill Date (Sep 15). They are separate invoice numbers even for the same customer and same originating deal, because they follow separate billing triggers (shipment vs subscription cycle).

**Where it goes:** Clicking any row → Screen 13 (Invoice Detail).

---

### Screen 13 — Invoice Detail (INV-1042, Acme Corp)
**Purpose:** Track one invoice's lifecycle and let Finance record payment.

**What's on it:**
- A horizontal status pipeline: `Order Confirmed (done) → Shipped (done) → Invoiced (current) → Paid (pending)`
- Table:

| Invoice # | Amount | Status | Due Date |
|---|---|---|---|
| INV-1042 | $2,730 | Unpaid | Sep 10 |
| INV-1043 (Recurring) | $46 | Paid | Sep 15 |

- Buttons: **Record Payment**, **Download Summary**
- Banner: *"Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships."*

**Rule — the pipeline dictates billing timing:** An invoice for one-time lines cannot be generated (or at minimum cannot be marked "Invoiced") until that portion of the order has actually **Shipped**. If Q-1042 had been split across two warehouses and only the Main Warehouse's 18 units shipped so far, the customer is only invoiced for the shipped portion right now, the East Depot portion gets its own invoice once *it* ships. This is what "partial invoicing stays reconciled with partial delivery" means: you're never invoiced for something not yet in transit to you, and every invoice corresponds to something concrete that actually left a warehouse.

**Rule — Record Payment:** Marks the invoice Paid, timestamps it, and this status change is what flips the "Paid" node in the pipeline from pending to done, and updates the counts back on Screen 12 (Unpaid count goes down by one, Paid count goes up by one).

---

### Screen 14 — Deal Health and Anomaly Dashboard
**Purpose:** Catch problems before they quietly kill a deal or blow up margins, without a manager having to manually babysit every quote.

**What's on it:**
- Three summary cards:
  - **Stalled Deals** — "5 quotes idle 7+ days"
  - **Discount Anomalies** — "2 above rep average"
  - **Delivery Slippage** — "3 promise dates at risk"
- Table:

| Deal | Issue | Flagged | Action |
|---|---|---|---|
| Zenith Co | Idle 9 days | Aug 24 | Nudge sent |
| Delta LLC | Discount 22% vs avg 8% | Aug 25 | Escalated to Manager |

- Buttons: **Escalate**, **Nudge Rep**

**Rule — how "Stalled" is defined:** A quote in Draft, Pending Approval, or Negotiation stage that has had **zero status-changing activity** (no edits, no approvals, no customer replies) for longer than an Admin-configured threshold (the wireframe's example threshold is 7 days). It does not include Confirmed deals, those are done, they can't stall.

**Rule — how a "Discount Anomaly" is defined:** The system tracks each rep's **historical average discount %** across their past quotes. If a new quote's discount is significantly above that rep's own personal average (Delta LLC's example: 22% given vs their usual 8% average), it's flagged, **even if that 22% is technically within the customer's tier ceiling and would otherwise auto-approve**. This is a separate, softer check layered on top of the hard tier/category limits, it exists to catch "this rep is behaving unusually" even when no hard rule was technically broken.

**Rule — "Delivery Slippage":** Flags orders where the originally promised delivery date is at risk of being missed, based on current fulfillment/shipment status versus the promised date.

**Rule — Escalate vs Nudge Rep:** **Nudge Rep** sends an automatic reminder to the rep who owns that deal (a soft, first-line action). **Escalate** brings it directly to the Sales Manager's attention, skipping the rep (used for more serious anomalies, like Delta LLC's discount pattern, which management should know about regardless of whether the rep responds to a nudge).

**Where it goes:** Clicking an alert row opens the related quotation directly (Screen 4 or Screen 6, whichever is relevant to its current stage).

---

### Screen 15 — Admin / Reporting Dashboard (Optional)
**Purpose:** Company-wide analytics, filterable, exportable. Marked "Optional" in the wireframe, meaning it's a nice-to-have on top of the core flow, not part of the pass/fail core logic.

**What's on it:**
- Filters: **Period, Sales Team, Approval Status, Product**
- Summary cards: **Quotes Created** ("148 this month"), **Avg Approval Time** ("6.4 hours"), **Top Upsold Product** ("Care Plan 2yr")
- Buttons: **Export PDF**, **Export XLS**

**Rule:** Every summary card and every underlying report respects whatever combination of filters is currently set, e.g., "Quotes Created" filtered to Sales Team = "Rahul's Team" and Period = "This Month" would only count that team's quotes in that window. Exports produce a file containing exactly what's currently on screen, not the whole unfiltered dataset.

---

### Screen 16 — Product Catalog (Dashboard)
**Purpose:** Every product, variant, and price list, in one browsable place. This is Admin's home base for the "backend configuration" side of the platform.

**What's on it:**
- Buttons: **+ New Product**, **Manage Price fields**
- Three summary cards: **Total Products** ("128 active, 6 archived"), **Pricelists** ("3 tiers, 2 Currencies"), **Variants** ("340 SKUs across all products")
- Table:

| Product name | Category | Variants | Price | Unit | Tax | Status |
|---|---|---|---|---|---|---|
| Laptop Pro 14 | Hardware | 3(size) | $1,200 | Each | 15% | Active |
| Onsite Setup Service | Services | — | $450 | Each | 10% | Active |
| Docking Station | Hardware | 3(color) | $180 | Each | 15% | Active |
| Care Plan 3 years | Subscription | — | $40/month | Recurring | 0% | Active |

**Rule:** "Archived" products (6 in the example) still exist for historical order/invoice reference (old orders that used them must still display correctly), but cannot be added to new quotations.

**Rule — "340 SKUs across all products":** A SKU here means every unique combination of a product plus its variant values (e.g., Laptop Pro 14 in Black/8GB/HP is one SKU, in Blue/4GB/Dell is a different SKU). The 340 count is the sum of all these combinations across the whole catalog, not just the count of base product names (128).

**Where it goes:** Clicking a product row → Screen 17 (Product Details page for that product).

---

### Screen 17 — Product Details Page
**Purpose:** Full configuration for one product: its general info, its variants, and its per-tier/currency pricing.

**What's on it:**
- **General Info:** Product name, Category, Price, Unit, Description, Tax %, **Subscription (Yes/No)**, **Recurring (Monthly/Yearly/Weekly)** — only meaningful/visible if Subscription = Yes, **Quantity on hand** (an integer field)
- **Product Variants** table:

| Attribute | Values | Extra Price |
|---|---|---|
| Color | Blue, Black | 0 |
| RAM | 4GB, 8GB | +$30 |
| Manufacturer | Dell, HP | +$10/+$30 |

- **Pricelists** table:

| Tier | Currency | Price Rule |
|---|---|---|
| Bronze | USD | Price, no adjustment |
| Gold | USD/EUR | Price minus 10 percent base |

- Banner notes: *"Product details should be filled. Recurring order with this product will be invoiced at the beginning of the period."*

**Rule — "invoiced at the beginning of the period":** For recurring products, the very first invoice fires **at the start** of a billing cycle (e.g., the day the plan begins, or the day a new monthly cycle begins), not at the end. This means the customer pays *before* the period of service, not after it, this is the default billing timing convention for every subscription product unless a specific plan is configured otherwise.

**Rule — how the Subscription flag interacts with an order:** If a rep adds a product with "Subscription: Yes" to a quotation (Screen 4), that line automatically becomes a **Recurring Line** once the order confirms (feeding Screen 9/10), separate from the One-Time Lines, using whatever Recurring cycle (Monthly/Yearly/Weekly) was configured here on the product itself.

---

### Screen 18 — Discount Tiers and Approval Chain Setup
**Purpose:** Where an Admin defines every rule described in Part 2.5 through 2.7. This is the control panel for the entire discount-governance system.

**What's on it:**
- **Tier Discount Ceilings** table: Bronze 5%, Silver 10%, Gold 15%
- **Category Discount Ceilings** table: Hardware 15%, Services 10%
- **Discount range → who approves** table:

| Discount range | Max Discount / Who Approves |
|---|---|
| Within tier/Category limit | No approval needed |
| Over limit, blended risk medium | Sales manager |
| Over limit, blended risk high | Sales manager then finance |

- Button: **Save configuration**
- Banner notes: *"When a quote mixes categories with different ceilings, the system must compute a blended risk score and route to the highest required level."* and *"All approvals, rejections, and edits must be logged with user, timestamp, and reason."*

**Rule:** These three tables are the literal inputs to every calculation described everywhere else in this document. Change Gold's ceiling from 15% to 20% here, and every quote built afterward respects the new number immediately, no code change needed, it's configuration, not a hardcoded rule (the PS explicitly requires this: "Core business rules must be implemented in application logic, not hardcoded or faked for the demo").

**Rule — the audit-logging requirement is global, not just for this screen:** Every approval, rejection, and edit *anywhere in the whole system* (not just quote approvals, also edits made *here* on the rules themselves) must be logged with who did it, when, and why. This is why Screen 6's audit trail table exists, and why changing a discount ceiling here should also, ideally, leave its own trace (e.g., "Admin X changed Gold ceiling from 15% to 20% on [date]").

---

## Part 4: Deep Dive — The Blended Discount Risk Score (worked math)

This is the single most important algorithm in the whole project, so here it is in full, step by step, using Q-1042 as the running example.

### Step 1: Determine each line's limit
For every line, take the **stricter of** (customer tier ceiling, product category ceiling).

| Line | Category | Category Ceiling | Customer Tier Ceiling | Effective Limit (stricter) |
|---|---|---|---|---|
| Laptop Pro 14 | Hardware | 15% | Gold = 15% | 15% |
| Onsite Setup Service | Services | 10% | Gold = 15% | 10% |
| Extended Warranty | (Warranty/Hardware-linked) | 15% | Gold = 15% | 15% |

### Step 2: Compare given discount to limit, per line
| Line | Discount Given | Limit | Over By |
|---|---|---|---|
| Laptop Pro 14 | 12% | 15% | 0 (within limit) |
| Onsite Setup Service | 18% | 10% | **8 points over** |
| Extended Warranty | 10% | 15% | 0 (within limit) |

### Step 3: Compute the "worst single line" signal
The single largest overage across all lines: **8 points** (from Onsite Setup Service).

### Step 4: Compute the "blended pattern" signal
Sum (or otherwise combine, per your team's exact formula, e.g., total overage points, or overage points weighted by line value) every line's overage, even small ones, so that **many small violations don't hide behind one clean-looking overall number**. In this example, only one line is over, so the blended pattern signal here equals the same 8 points. But imagine a different quote where three lines are each 2-3 points over and nothing looks individually alarming: the blended signal would still add these up (e.g., 2+3+2 = 7 total points of quiet overage) and flag the order, even though *no single line* looks dramatic on its own. This is the whole reason it's called "blended," it's protecting against a rep spreading small violations across many lines to avoid triggering a review on any one of them.

### Step 5: Convert the combined signal into a risk band
Using the rules from Screen 18:
- 0 points over anywhere → **LOW** → no approval needed, auto-approved.
- Some overage, but below an Admin-configured "high" threshold → **MEDIUM** → Sales Manager approval required.
- Overage above the "high" threshold (in Q-1042's case, 8 points is enough to cross into HIGH) → **HIGH** → Sales Manager then Finance approval required.

Q-1042 lands on **HIGH**, which is exactly what Screens 5 and 6 show.

### Why this design matters (repeating the PS's own reasoning, in plain terms)
- It means managers aren't stuck manually reviewing every single quotation, only the ones that actually earned a review.
- It stops a rep from keeping every individual line "technically" inside its limit while still discounting the whole order more than the company actually intends, by looking at the pattern across the whole order, not just the scariest-looking single line.

---

## Part 5: Deep Dive — Approval Chain State Machine

A quote's approval journey is a small state machine:

```
Draft
  │  (Submit for Approval)
  ▼
[Blended Score = LOW] ───────────────► Approved
  │
  │ [Blended Score = MEDIUM]
  ▼
Sales Manager Review ──(Approve)──► Approved
  │
  ├──(Return for Revision)──► Draft (edit, then resubmit → re-enters this same step)
  │
  └──(Reject)──► Rejected (dead, kept for record)

[Blended Score = HIGH]
  ▼
Sales Manager Review ──(Approve)──► Finance Review ──(Approve)──► Approved
  │                                      │
  ├──(Return for Revision)──►Draft       ├──(Return for Revision)──►Draft
  └──(Reject)──►Rejected                 └──(Reject)──►Rejected
```

**Key rule:** A HIGH-risk quote cannot skip Finance just because the Sales Manager approved it, both steps are mandatory in sequence. A MEDIUM-risk quote never touches Finance at all, it only needs the Sales Manager. The system decides which path to take *once*, at submission time (based on the Blended Score calculated then), and follows that path faithfully.

**Key rule:** "Resubmitted" after a "Returned" does not necessarily restart the whole chain from Sales Manager if it had already progressed further, unless the edit changed the Blended Score enough to change the required path (e.g., if the rep's fix brought every line back within limit, the resubmitted quote should recalculate to LOW and auto-approve, skipping the chain entirely this time).

---

## Part 6: Deep Dive — Warehouse Split Algorithm (step by step)

Given an order needing, say, 24 units of Laptop Pro 14:

1. **Pull current Available stock** for that product across every warehouse (In Stock minus Reserved, from Part 2.10).
2. **Rank warehouses** by their configured shipping-cost weighting (cheapest/most-preferred first).
3. **Greedily allocate**: take as much as possible from the top-ranked warehouse (up to its Available amount, capped at what's still needed), then move to the next warehouse for the remainder, repeat until either the full quantity is covered or every warehouse has been checked.
4. **Anything still uncovered** after checking every warehouse becomes a Backorder line for that product.
5. **Estimate shipments and cost**: each warehouse used contributes one shipment (unless an order from the same warehouse can be batched with another pending order to the same customer, an optimization, not a requirement), and cost is estimated from each warehouse's shipping weighting.
6. **Present as "Suggested Split"**, editable via Manual Override.
7. **Monitor for restock**: if a warehouse that held a backordered line later increases its Available stock enough to cover the shortfall, automatically surface the "Consolidate Remaining Backorder" prompt (Screen 8) rather than silently auto-shipping a tiny separate parcel.

---

## Part 7: Deep Dive — Hybrid Billing, Subscriptions, and Proration

### 7.1 Splitting a mixed order into One-Time vs Recurring
At the moment an order is confirmed, walk through every line:
- If the line's product has **Subscription = No** → it becomes a **One-Time Line**, billed once, tied to shipment.
- If the line's product has **Subscription = Yes** → it becomes a **Recurring Line**, spinning off (or attaching to an existing) Subscription record, using that product's configured Cycle.

### 7.2 Billing timing rules
- One-time lines: invoice only fires (or at minimum, only flips to "Invoiced" status) once that specific line has **shipped**. Partial shipment across warehouses → partial invoicing, one invoice per shipped portion, never invoicing for something still sitting in a warehouse.
- Recurring lines: invoice fires automatically at the **start** of each billing cycle (per Screen 17's note), independent of any shipment event, since a subscription service doesn't "ship" the same way a laptop does.

### 7.3 Proration on mid-cycle change (already shown once in Screen 10, generalized here)
Formula:
```
Extra/refunded charge = (New price − Old price) × (days remaining in cycle ÷ total days in cycle)
```
Applies symmetrically: a downgrade produces a *negative* number (a credit), an upgrade produces a *positive* number (an extra charge).

### 7.4 Cancellation mid-cycle
If a customer already paid for the current cycle in full and cancels partway through, issue a **credit note** for the unused portion, calculated with the same formula, but treating "New price" as $0 (since no more service will be delivered):
```
Refund amount = Old price × (days remaining ÷ total days in cycle)
```

**Worked example:** Support SLA is $300/quarter (90-day cycle), paid upfront. Customer cancels on day 60 (30 days remaining).
```
Refund = $300 × (30 ÷ 90) = $100
```
A credit note for $100 is issued.

---

## Part 8: Deep Dive — Customer Portal Negotiation Logic

1. Customer opens their own quotation (only theirs, never anyone else's).
2. Customer can leave a comment on any specific line ("Can this be 15% off instead of 10%?") without it changing anything yet, this is just a message.
3. Customer can propose a **Counter Discount %** and/or a **Requested Delivery Date**, then hit **Submit Request** — this notifies the rep, who can accept, reject, or counter-counter back through their own internal editing on Screen 4.
4. Whatever the rep and customer land on, the moment the customer clicks **Confirm Quotation**, the system re-runs the exact same Blended Discount Risk Score calculation (Part 4) on the *final* numbers.
5. If the final numbers are within every limit → the deal moves straight to Confirmed → Fulfillment/Billing begins.
6. If the final numbers are over any limit → the deal automatically re-enters the Approval Chain state machine (Part 5), starting from the correct step based on the *newly recalculated* risk band, exactly as if it were a brand-new submission. The customer is not shown this internal approval process, they simply see their quote's status update once it clears (or if it's returned/rejected internally, the rep is responsible for going back to the customer, not the system directly).

---

## Part 9: Deep Dive — Deal Health & Anomaly Detection Logic

Three independent checks run continuously (not just once at submission):

1. **Stalled Deal check:** `(today − last_activity_date) > stalled_threshold_days` for any quote in Draft, Pending Approval, or Negotiation. Default threshold is Admin-configurable (example used: 7 days).
2. **Discount Anomaly check:** compute `rep_historical_average_discount` (a rolling average of that specific rep's past given-discounts across all their historical quotes). Flag if a *new* quote's discount is significantly above that rep's own average (not compared to other reps, not compared to a company-wide average, specifically *that rep's own personal pattern*). This check runs independently of, and in addition to, the hard tier/category limit checks, a quote can be perfectly within its hard limits and still get flagged here for being unusual *for that particular rep*.
3. **Delivery Slippage check:** compare the originally promised delivery date against current fulfillment progress/estimated ship date; flag if the promise is now at risk.

Each flagged item generates one row in the Deal Health table with an **Issue** description, a **Flagged** date, and an available **Action** (Nudge Rep or Escalate), and clicking the row deep-links straight to the underlying quotation so a manager never has to go hunting for it manually.

---

## Part 10: One Fully Worked End-to-End Example (start to finish, all numbers)

This threads every module above into a single continuous story, using consistent numbers throughout (slightly cleaned up from the raw wireframe placeholders, so the math is internally consistent start to finish).

**1. Setup (Admin, Screens 16-18):**
Laptop Pro 14 is Hardware, $1,200 base, Category ceiling 15%. Onsite Setup Service is Services, $450 base, Category ceiling 10%. Extended Warranty is treated under the 15%-ceiling group. Acme Corp is Gold tier, ceiling 15%.

**2. Rep builds the quote (J. Rao, Screen 4, Q-1042):**
- Laptop Pro 14 × 2 @ $1,200 = $2,400, discount 12% → Limit 15% → OK
- Onsite Setup Service × 1 @ $450, discount 18% → Limit 10% → 8pt OVER
- Extended Warranty × 1 @ $180, discount 10% → Limit 15% → OK
- Rep accepts the "+Care Plan 2yr" upsell suggestion (Margin +$46), adding a $46/month recurring line.
- Rep hits **Submit for Approval**.

**3. Risk calculated (Part 4):** Worst-line overage = 8 points → **Blended Risk = HIGH**.

**4. Approval chain kicks in (Screens 5-6):**
- Quote appears in M. Shah's (Sales Manager) queue as HIGH risk.
- M. Shah initially **Returns for Revision** on Aug 21 ("Requested justification").
- J. Rao adds a margin note and **Resubmits** on Aug 22.
- M. Shah **Approves**. Because risk = HIGH, the chain automatically advances to Finance.
- R. Iyer (Finance) reviews and **Approves**.
- Quote moves to **Approved** stage.

**5. Fulfillment (Screens 7-8):**
Order needs 2 Laptop Pro 14 units. Main Warehouse has enough Available stock, so the system suggests fulfilling entirely from Main Warehouse, 1 shipment, no split needed for this particular quantity (a simpler case than the wireframe's own bigger illustrative numbers, deliberately, to keep this worked example self-consistent). Rep/ops accepts the suggested plan.

**6. Shipment happens →one-time invoice generated (Screens 12-13):**
Once the 2 laptops + onsite setup line ship, invoice **INV-1042** is generated for the one-time portion: (2 × $1,200 × 0.88) + ($450 × 0.82) ≈ $2,112 + $369 = **$2,481**, marked Unpaid, due in 20 days.

**7. Subscription spins up (Screens 9-10):**
The Care Plan 2yr line becomes an Active subscription for Acme Corp, Monthly cycle, Next Bill Date set to the start of the next billing period, $46/month.

**8. First recurring invoice fires automatically (Screen 12):**
At the start of the new billing period, invoice **INV-1043** for $46 is generated automatically, no rep action needed, and gets paid promptly, so it shows as Paid.

**9. Customer negotiates before final confirm (Screen 11):**
Suppose in this version of the story, negotiation happens *before* final confirmation rather than after (both are possible, the state machine supports re-entering approval at confirm time regardless of when in the lifecycle the negotiation happens). Acme Corp's portal user comments on Extended Warranty ("Can this be 15% off instead of 10%?") and submits the request. J. Rao agrees and updates the discount to 15% (still within Extended Warranty's 15% limit, so this alone doesn't newly trigger anything). Customer clicks **Confirm Quotation**.

**10. Final re-check on confirm (Part 8, Step 4):** Recalculating with Extended Warranty now at 15% (still within its own limit) changes nothing about the Onsite Setup Service line, which was already the sole reason for HIGH risk, and that line hasn't changed. So the recalculated risk is still HIGH, meaning by rule, **the quote would need to pass through approval again** even though it already did once before, because confirmation always re-checks the *final* terms, and any HIGH-risk final state always requires the full chain. (If your team wants a lighter rule, e.g. "only re-check lines that actually changed," that's a valid design simplification to consider, but the PS's stated default is: any change in final terms is re-validated in full at confirm time.)

**11. Deal Health, throughout (Screen 14):** If this back-and-forth in step 9 had dragged past 7 days of inactivity at any point, Q-1042 would have shown up as a Stalled Deal on the dashboard, and if J. Rao's discount pattern across his recent quotes had been unusually high compared to his own average, it would have separately shown up as a Discount Anomaly too, both checks run independently of whatever stage the deal is actually in.

**12. Reporting (Screen 15):** At month end, this deal contributes to "Quotes Created" for the period, its approval turnaround time (from first Submit to final Approved) feeds into "Avg Approval Time," and Care Plan 2yr, having been upsold successfully here, contributes to "Top Upsold Product."

---

## Part 11: Edge Cases and Design Decisions to Make Explicit

These situations aren't spelled out in full detail by the original PS, but the wireframes and rules above imply they will happen, so they should be decided on deliberately rather than discovered accidentally while building:

1. **A line is edited after partial approval.** Should the whole approval chain restart, or only re-run if the recalculated Blended Score actually changes? (Part 10, Step 10 shows this exact ambiguity.)
2. **Two different quotes reserve the same warehouse stock at the same time.** Whichever quote reaches "Approved" first should lock in its Reserved amount; the later one should recalculate Available stock fresh and may end up with a smaller/no split or a Backorder it didn't originally expect.
3. **A subscription is cancelled the same day it was supposed to auto-bill.** Decide whether cancellation-before-billing-time cancels that cycle's charge, or whether it still bills once more before stopping (recommend: cancellation is effective immediately, so no further charge fires once cancelled).
4. **A product's category ceiling changes (Screen 18) after quotes already exist using the old ceiling.** Existing Draft quotes should recalculate against the new ceiling the next time they're touched; already-Confirmed orders should NOT retroactively change (they're historical record).
5. **Customer requests a delivery date that's impossible given current stock/backorder status.** The rep should see this request but the system should not auto-promise it, a human (rep) must confirm feasibility before it becomes the new promised date (which then feeds into Delivery Slippage tracking).
6. **A rep manually overrides a warehouse split into something that leaves Available stock negative for another pending order.** The system should warn at override time, not silently allow oversell.
7. **Multi-currency price lists (Bronze=USD, Gold=USD/EUR).** Decide the exact conversion-rate source and refresh frequency if a Gold customer is billed in EUR (this is called out in the PS as a "bonus, not a requirement," so it's fine to keep simple, e.g. a manually set static rate, for the hackathon version).
8. **A Discount Anomaly fires on a quote that's already Auto-Approved (LOW risk).** This should still be allowed to happen and show up on the Deal Health dashboard (Part 9), since anomaly detection is about the rep's personal pattern, not about whether hard limits were technically broken.

---

## Part 12: What "Done" Looks Like (recap of the PS's own test flow, mapped to these screens)

1. Set up one discount tier, one warehouse, one subscription plan → Screens 18, 7, 17.
2. Create a quote, add a line with an over-limit discount → Screen 4.
3. Confirm it auto-routes for approval without the rep asking → Screens 5-6.
4. Accept an upsell suggestion mid-build, confirm total/margin update instantly → Screen 4.
5. Get it approved, confirm stock pulls from the right warehouse(s), splitting if needed → Screens 7-8.
6. Confirm a one-time product and a subscription on the same order bill correctly and separately → Screens 9-10, 12-13.
7. Open the customer portal, request a bigger discount as the customer, confirm it goes back for approval automatically → Screen 11 → back to Screen 6.
8. Confirm the order, record a payment, confirm invoice status updates → Screens 13, 12.

If all eight behave as described in the corresponding Parts above, the core logic is solid.