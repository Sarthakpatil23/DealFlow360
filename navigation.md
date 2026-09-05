# DealFlow360 — Complete System Navigation & Architecture Guide

> **Document Version:** 1.0.0  
> **Target Audience:** Developers, Evaluators, Product Managers, and End-Users  
> **Last Updated:** September 2026  
> **Codebase Branch:** `main`  

---

## Table of Contents

1. [System Architecture & Technology Stack](#1-system-architecture--technology-stack)
2. [User Personas & Role-Based Access Control (RBAC)](#2-user-personas--role-based-access-control-rbac)
3. [Global Navigation Chrome & The Live Persona Switcher](#3-global-navigation-chrome--the-live-persona-switcher)
4. [Complete Screen-by-Screen Walkthrough (All 24+ Routes)](#4-complete-screen-by-screen-walkthrough-all-24-routes)
   - [Screen 1: Authentication (`/login`)](#screen-1-authentication-login)
   - [Screen 2: Role-Adaptive Sales Dashboard (`/dashboard`)](#screen-2-role-adaptive-sales-dashboard-dashboard)
   - [Screen 3: Quotations Pipeline & Kanban (`/quotations`)](#screen-3-quotations-pipeline--kanban-quotations)
   - [Screen 4: Quotation Builder (`/quotations/new`)](#screen-4-quotation-builder-quotationsnew)
   - [Screen 4 / 11: Quotation Detail & Negotiation (`/quotations/[id]`)](#screen-4--11-quotation-detail--negotiation-quotationsid)
   - [Screen 5: Approvals Queue List (`/approvals`)](#screen-5-approvals-queue-list-approvals)
   - [Screen 6: Approval Detail & Two-Tier Signoff (`/approvals/[id]`)](#screen-6-approval-detail--two-tier-signoff-approvalsid)
   - [Screen 7: Warehouse Fulfillment & Stock (`/fulfillment`)](#screen-7-warehouse-fulfillment--stock-fulfillment)
   - [Screen 8: Order Allocation & Split Shipments (`/fulfillment/[id]`)](#screen-8-order-allocation--split-shipments-fulfillmentid)
   - [Screen 9: Invoices & Payment Reconciliation (`/invoices`)](#screen-9-invoices--payment-reconciliation-invoices)
   - [Screen 9 Detail: Invoice Detail & Printable Bill (`/invoices/[id]`)](#screen-9-detail-invoice-detail--printable-bill-invoicesid)
   - [Screen 10: Subscriptions & Recurring Plans (`/subscriptions`)](#screen-10-subscriptions--recurring-plans-subscriptions)
   - [Screen 10 Detail: Subscription Billing Detail (`/subscriptions/[id]`)](#screen-10-detail-subscription-billing-detail-subscriptionsid)
   - [Screen 11: Customer Portal Negotiation (`/portal/[id]`)](#screen-11-customer-portal-negotiation-portalid)
   - [Customer Portal Dashboard (`/portal`)](#customer-portal-dashboard-portal)
   - [Screen 12: Deal Health Console (`/deal-health`)](#screen-12-deal-health-console-deal-health)
   - [Screen 13: Reports & Analytics (`/reports`)](#screen-13-reports--analytics-reports)
   - [Screen 14: Products Catalog (`/products`)](#screen-14-products-catalog-products)
   - [Screen 15: Create New Product (`/products/new`)](#screen-15-create-new-product-productsnew)
   - [Screen 16: Product Detail & Variants (`/products/[id]`)](#screen-16-product-detail--variants-productsid)
   - [Screen 17: Price Lists & Currency Multipliers (`/products/price-fields`)](#screen-17-price-lists--currency-multipliers-productsprice-fields)
   - [Screen 18: Discount Tiers & Approval Setup (`/discount-approval-setup`)](#screen-18-discount-tiers--approval-setup-discount-approval-setup)
   - [Test Harness: Discount Engine Verification (`/test/discount-check`)](#test-harness-discount-engine-verification-testdiscount-check)
   - [Security Gate: Access Denied (`/unauthorized`)](#security-gate-access-denied-unauthorized)
5. [Core Business Logic Engines in Detail](#5-core-business-logic-engines-in-detail)
   - [5.1 The Stricter Discount Ceiling Rule](#51-the-stricter-discount-ceiling-rule)
   - [5.2 Blended Risk Score Calculation](#52-blended-risk-score-calculation)
   - [5.3 Two-Tier Approval Chains](#53-two-tier-approval-chains)
   - [5.4 Warehouse Allocation & Stock Splits](#54-warehouse-allocation--stock-splits)
   - [5.5 Recurring Subscription Lifecycle & Billing Cycles](#55-recurring-subscription-lifecycle--billing-cycles)
   - [5.6 Deal Health & Stalled Quotation Engine](#56-deal-health--stalled-quotation-engine)
6. [End-to-End User Journey Walkthrough (The Q-1042 Lifecycle)](#6-end-to-end-user-journey-walkthrough-the-q-1042-lifecycle)
7. [Quick Navigation & Role Matrix Reference](#7-quick-navigation--role-matrix-reference)

---

## 1. System Architecture & Technology Stack

DealFlow360 is an enterprise Configure-Price-Quote (CPQ), approval governance, multi-warehouse fulfillment, and recurring billing platform built on modern Next.js architecture:

- **Framework:** Next.js 14.2 (App Router with Server Components & Server Actions)
- **Database & ORM:** PostgreSQL running with Prisma 5.22
- **Authentication & RBAC:** NextAuth.js v5 (Beta 32) using JWT session strategy with cryptographic cookie verification
- **Styling & Design System:** Tailwind CSS with the minimalist Vercel Geist aesthetic (`#171717` ink, `#fafafa` canvas, `#ebebeb` hairlines, `#0070f3` link blue)
- **Icons & Motion:** Lucide React, Tabler Icons, and Framer Motion
- **Data Integrity:** Fully relational database schema with foreign keys, enums, transaction rollbacks, and append-only audit logging

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS 14 APP ROUTER                         │
├───────────────────────────────────┬────────────────────────────────────┤
│   INTERNAL WORKSPACE (/dashboard) │    CUSTOMER PORTAL (/portal)       │
│   • Sales Rep                     │    • Customer Contact              │
│   • Sales Manager                 │    • Per-line Commenting           │
│   • Finance & Operations          │    • Counter-Discount Submission   │
│   • System Administrator          │    • Quote Confirmation & Orders   │
├───────────────────────────────────┴────────────────────────────────────┤
│                     MIDDLEWARE (src/auth.config.ts)                    │
│   • Session check • Customer isolation • Role-based route guard        │
├────────────────────────────────────────────────────────────────────────┤
│                       SERVER ACTIONS (src/app/actions)                 │
│   • Auth • Quotes • Approvals • Governance • Fulfillment • Invoices    │
├────────────────────────────────────────────────────────────────────────┤
│                     BUSINESS ENGINES (src/lib/business-logic)          │
│   • Discount Limits • Blended Risk • Deal Health • Warehouse Splits    │
├────────────────────────────────────────────────────────────────────────┤
│                    PRISMA ORM & POSTGRESQL DATABASE                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Personas & Role-Based Access Control (RBAC)

DealFlow360 supports **5 distinct roles**. Each role has specific permissions enforced both at the UI layer (conditional components) and the server layer (route middleware and server action guards).

### Canonical Personas & Seed Credentials

All demo accounts share the password: `password123`.

| Persona | Name | Email | Role Key | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Rep** | J. Rao | `jrao@dealflow.com` (or `rep.rao@dealflow.com`) | `REP` | Builds quotes, applies discounts, reviews upsells, responds to customer counter-offers. |
| **Sales Manager** | M. Shah | `mshah@dealflow.com` | `MANAGER` | Step 1 Approver on medium/high-risk deals, oversees team pipeline, nudges reps, configures discount ceilings. |
| **Finance & Ops** | R. Iyer | `riyer@dealflow.com` | `FINANCE` | Step 2 Approver on high-risk margin breaches, manages warehouse stock splits, reconciles unpaid invoices. |
| **System Admin** | Admin User | `admin@dealflow.com` | `ADMIN` | Manages products, variants, price lists, discount tiers, warehouses, platform-wide analytics. |
| **Customer** | Acme Corp | `buyer@betaind.com` (or `procurement@acme.com`) | `CUSTOMER` | Customer Portal access only. Views quotes, submits line counter-offers, confirms deals. |

### Role Permissions Matrix

| Module / Action | Sales Rep | Sales Manager | Finance | Admin | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Access Internal Dashboard (`/dashboard`)** | ✅ | ✅ | ✅ | ✅ | ❌ *(Redirected to `/portal`)* |
| **Access Customer Portal (`/portal`)** | ❌ *(Redirected to `/dashboard`)* | ❌ | ❌ | ❌ | ✅ |
| **Create / Edit Quotations (`/quotations/new`)** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Approve Quotation — Step 1 (`SALES_MANAGER`)** | ❌ *(Buttons hidden, 403)* | ✅ | ❌ | ✅ | ❌ |
| **Approve Quotation — Step 2 (`FINANCE`)** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Discount Governance Setup (`/discount-approval-setup`)** | ❌ *(Redirected to `/unauthorized`)* | ✅ | ❌ | ✅ | ❌ |
| **Deal Health Nudge / Escalate** | ❌ *(Buttons hidden)* | ✅ | ❌ | ✅ | ❌ |
| **Allocate Stock & Warehouse Splits (`/fulfillment`)** | Read-only | Read-only | ✅ Edit | ✅ Edit | ❌ |
| **Record Invoice Payments (`/invoices`)** | Read-only | Read-only | ✅ Edit | ✅ Edit | ❌ |
| **Product & Price List Management (`/products`)** | Read-only | Read-only | Read-only | ✅ Edit | ❌ |

---

## 3. Global Navigation Chrome & The Live Persona Switcher

### 3.1 Top Navigation Bar (`TopNav`)
The persistent header present on all internal screens (`/src/components/navigation/top-nav.tsx`):

1. **Brand Wordmark:** Clicking **DealFlow360** returns to `/dashboard`.
2. **Module Links (9 primary navigation items):**
   - `Dashboard` → `/dashboard`
   - `Quotations` → `/quotations`
   - `Approvals` → `/approvals`
   - `Fulfillment` → `/fulfillment`
   - `Subscriptions` → `/subscriptions`
   - `Invoices` → `/invoices`
   - `Deal Health` → `/deal-health`
   - `Reports` → `/reports`
   - `Products` → `/products`
3. **Live Persona Switcher Dropdown (`PersonaSwitcher`):**
   - Click to open the persona switcher modal.
   - Allows instant role switching between J. Rao (Rep), M. Shah (Manager), R. Iyer (Finance), Admin, or Acme Corp (Customer).
   - Dynamically re-authenticates via `switchPersonaAction` without manual password re-entry, preserving your active route.
4. **Theme Toggle:** Switch between Light mode (`#fafafa` canvas) and Dark mode (`#000000` canvas).
5. **Sign Out:** Invokes `logoutAction()` and clears the NextAuth session cookie, redirecting to `/login`.

### 3.2 Customer Portal Navigation (`CustomerPortalNav`)
The dedicated header for customers on `/portal`:

1. **Brand Context:** Displays the customer company name (e.g. **Acme Corp**) and customer tier badge (**GOLD TIER** in amber, **SILVER TIER** in slate, **BRONZE TIER** in orange).
2. **Customer Navigation Tabs:**
   - `Orders & Shipments` — Live tracking of confirmed warehouse fulfillments.
   - `Quotes & Proposals` — All draft, pending, and negotiation quotations.
   - `Billing & Invoices` — Unpaid invoices, payment status, credit notes.
3. **Live Persona Switcher & Theme Toggle:** Identical switcher allowing evaluators to jump directly back to internal manager/rep personas.

---

## 4. Complete Screen-by-Screen Walkthrough (All 24+ Routes)

---

### Screen 1: Authentication (`/login`)

- **URL:** `http://localhost:3000/login`
- **File:** [`src/app/login/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/login/page.tsx) & [`src/components/auth-screen.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/auth-screen.tsx)
- **Access:** Public. Logged-in users are automatically redirected to `/dashboard` (internal) or `/portal` (customer).
- **What's on it:**
  - Split-screen layout: Left form with brand logo and theme toggle; right aesthetic hero.
  - **Sign In Tab:** Email and password input with remember state.
  - **Sign Up Tab:** Full Name, Email, Password, Account Type (Internal Staff vs Customer), and Initial Role (`REP`, `MANAGER`, `FINANCE`, `ADMIN`).
  - **1-Click Demo Persona Buttons:** Pre-populates credentials for **Sales Rep** (`jrao@dealflow.com`), **Manager** (`mshah@dealflow.com`), **Finance** (`riyer@dealflow.com`), **Admin** (`admin@dealflow.com`), and **Customer** (`buyer@betaind.com`). Password for all is `password123`.
- **Interactions:**
  - Submitting Sign In triggers `loginWithCredentials(formData)`.
  - On success, internal users land on `/dashboard`; customers land on `/portal`.
  - Supports `callbackUrl` query parameter to redirect back to the page the user was trying to access.

---

### Screen 2: Role-Adaptive Sales Dashboard (`/dashboard`)

- **URL:** `http://localhost:3000/dashboard`
- **File:** [`src/app/dashboard/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/dashboard/page.tsx) & [`src/lib/dashboard-data.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/lib/dashboard-data.ts)
- **Access:** Internal staff only (`REP`, `MANAGER`, `FINANCE`, `ADMIN`). Customers are redirected to `/portal`.
- **Dynamic Role Adaptation:**
  The dashboard automatically reads `session.user.role` (or the URL override `?role=MANAGER` / `?role=REP` / `?role=FINANCE` for side-by-side tab testing).
  
  #### Persona 1: Sales Representative (`REP`)
  - **Badge:** `Sales Representative` (Emerald) — *"Personal pipeline, quotation builder & customer negotiation"*
  - **Summary Cards (Personal Scoping):**
    - `Pending Approvals`: Shows quotes owned by this rep waiting on approvals (e.g. *"6 of your quotations waiting"*).
    - `Open Quotations`: Active deals owned by this rep (e.g. *"21 of your active deals"*).
    - `At-Risk Deals`: Deals owned by this rep flagged by Deal Health (e.g. *"6 of your deals flagged"*).
  - **Quick Action Buttons:**
    - `+ New Quotation` (Primary `#0070f3`) → Opens `/quotations/new`.
    - `View Approvals` (Secondary) → Opens `/approvals`.
  - **Activity Feed:** Scoped to quotations owned by J. Rao (e.g. *"Acme Corp (Q-1042) submitted for approval by J. Rao"*).

  #### Persona 2: Sales Manager (`MANAGER`)
  - **Badge:** `Sales Manager` (Purple) — *"Team pipeline oversight, approval queue & discount governance"*
  - **Summary Cards (Team-Wide Scoping):**
    - `Approvals Awaiting Review`: Step 1 pending approval steps across all reps (e.g. *"16 quotations awaiting manager review"*).
    - `Team Open Pipeline`: Total active deals across team (e.g. *"61 active deals across team"*).
    - `At-Risk Deals`: Total deal health anomalies across team (e.g. *"15 flagged by Deal Health"*).
  - **Quick Action Buttons:**
    - `Review Approvals` (Primary `#0070f3`) → Opens `/approvals`.
    - `Deal Health Console` (Secondary) → Opens `/deal-health`.
    - `Discount Rules Setup` (Secondary) → Opens `/discount-approval-setup`.
  - **Activity Feed:** Displays team-wide approval requests and discount adjustments across all reps.

  #### Persona 3: Finance & Operations (`FINANCE`)
  - **Badge:** `Finance & Operations` (Blue) — *"High-risk margin signoff, invoice billing & warehouse fulfillment"*
  - **Summary Cards (Financial & Operational Scoping):**
    - `High-Risk Approvals`: Step 2 approvals exceeding discount ceilings (e.g. *"1 high-risk quotations awaiting finance"*).
    - `Unpaid Invoices`: Count and dollar volume of open customer receivables (e.g. *"12 unpaid invoices ($12,138)"*).
    - `Fulfillment & Backorders`: Orders awaiting stock allocation or split shipment (e.g. *"8 orders awaiting stock allocation"*).
  - **Quick Action Buttons:**
    - `Review Approvals` (Primary `#0070f3`) → Opens `/approvals`.
    - `Invoices & Payments` (Secondary) → Opens `/invoices`.
    - `Fulfillment & Stock` (Secondary) → Opens `/fulfillment`.

- **Interactions:**
  - Header displays current user name and role badge.
  - Subtle `View as: Rep · Manager · Finance` switcher in top right lets you preview any role view in a new tab without cookie collisions.
  - Every card and activity item deep-links directly to its target record.

---

### Screen 3: Quotations Pipeline & Kanban (`/quotations`)

- **URL:** `http://localhost:3000/quotations`
- **File:** [`src/app/quotations/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/quotations/page.tsx) & [`src/components/quotations/quotations-kanban-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/quotations/quotations-kanban-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Header with pipeline metrics (Total Pipeline Value, Won Deals, Active Deals, Win Rate).
  - Search input (by quote code or customer name) and Rep filter dropdown.
  - Toggle between **Kanban Board View** and **Table View**.
  - **5 Canonical Kanban Columns (Stages):**
    1. `Draft` — Initial quote creation in builder.
    2. `Pending Approval` — Submitted for manager/finance discount review.
    3. `Approved` — Signed off by approvers; ready for customer.
    4. `Negotiation` — Customer has submitted line counter-discounts on portal.
    5. `Confirmed` — Signed by customer; order booked and sent to fulfillment.
- **Interactions:**
  - Clicking any quotation card opens its detail view (`/quotations/[id]`).
  - `+ New Quotation` button jumps straight into the Quotation Builder (`/quotations/new`).
  - Filter by stage, search query, or sales rep.

---

### Screen 4: Quotation Builder (`/quotations/new`)

- **URL:** `http://localhost:3000/quotations/new`
- **File:** [`src/app/quotations/new/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/quotations/new/page.tsx) & [`src/components/quotations/quotation-builder.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/quotations/quotation-builder.tsx)
- **Access:** Sales Reps, Managers, Admins.
- **What's on it:**
  - **Customer Combobox (`CustomerComboboxSelector`):** Searchable modal with tier badges (**GOLD**, **SILVER**, **BRONZE**), currency preferences, and tier filter pills.
  - **Price List Auto-Selection:** When Acme Corp (Gold) is selected, price list automatically sets to `Standard (USD) — Gold Tier (15%)`, giving a 10% base discount before manual line discounts.
  - **Order Lines Table:**
    - Product picker (Hardware, Services, Subscriptions).
    - Quantity selector.
    - Unit Price with variant adjustments.
    - **Discount % Input with Live Limit Enforcement:** Displays the effective ceiling (e.g. `Limit: 10% (Category)`). Typing `18%` immediately flags the line with an amber pill: `OVER (+8pt)`.
    - Line Total calculation.
    - Remove line button.
  - **Smart Upsell Suggestion Banner:** When Hardware (Laptop Pro 14) is added, engine suggests complementary products (Extended Warranty or Onsite Setup Service) with 1-click `+ Add Upsell` button.
  - **Blended Risk Score Widget:** Computes live blended overage points across all lines. Shows `LOW` (green), `MEDIUM` (purple), or `HIGH` (rose).
  - **Summary Box:** Subtotal, Discount Amount, Tax, Grand Total.
- **Interactions:**
  - `Save Draft` → Saves quotation in `DRAFT` stage.
  - `Submit for Approval` → Evaluates risk score:
    - If `LOW` (within ceilings) → Status becomes `APPROVED` immediately.
    - If `MEDIUM` → Creates Step 1 for `SALES_MANAGER` and moves quote to `PENDING_APPROVAL`.
    - If `HIGH` → Creates Step 1 for `SALES_MANAGER` and Step 2 for `FINANCE`.

---

### Screen 4 / 11: Quotation Detail & Negotiation (`/quotations/[id]`)

- **URL:** `http://localhost:3000/quotations/Q-1042` (or quotation ID)
- **File:** [`src/app/quotations/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/quotations/[id]/page.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Quotation header with display code, stage badge, customer tier, created date, and owner rep.
  - Complete line items breakdown with discounts and limits.
  - **Negotiation Feed:** If customer submitted counter-discounts on Screen 11, the comments and counter-offers are displayed inline.
  - Rep response input: Rep can accept counter-discount, propose revised price, or add counter-comment.
  - Action buttons: `Submit Revised Quote`, `Send to Customer`, `Cancel Quotation`.

---

### Screen 5: Approvals Queue List (`/approvals`)

- **URL:** `http://localhost:3000/approvals`
- **File:** [`src/app/approvals/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/approvals/page.tsx) & [`src/components/approvals/approvals-list-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/approvals/approvals-list-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Status tabs: `All Pending`, `Requires My Action`, `Step 1 (Manager)`, `Step 2 (Finance)`, `History (Approved/Rejected)`.
  - Search by quote code or customer name.
  - Approvals Table:
    - Quote display code (e.g. `Q-1042`).
    - Customer Name & Tier badge.
    - Submitting Sales Rep.
    - Total Value.
    - Blended Risk Level badge (`MEDIUM` or `HIGH`).
    - Current Step (`Step 1: Sales Manager` or `Step 2: Finance`).
    - Time waiting / submitted date.
    - 1-Click `Review →` CTA.
  - Link to Screen 18: `Discount & Approval Setup` in header (for Managers/Admins).

---

### Screen 6: Approval Detail & Two-Tier Signoff (`/approvals/[id]`)

- **URL:** `http://localhost:3000/approvals/Q-1042`
- **File:** [`src/app/approvals/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/approvals/[id]/page.tsx) & [`src/components/approvals/approval-detail-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/approvals/approval-detail-view.tsx)
- **Access:** Internal staff.
- **Role-Gated Actions:**
  - **For Sales Reps:** Action buttons (`Approve`, `Return`, `Reject`) are hidden. A read-only notice is displayed: *"Submitted for review. Awaiting sign-off by Sales Manager (Step 1) or Finance (Step 2)."* Includes 1-click persona switch buttons to easily test as Manager or Finance.
  - **For Sales Managers:** Can approve Step 1.
  - **For Finance:** Can approve Step 2 once Step 1 is signed off.
- **What's on it:**
  - **Two-Step Approval Stepper Widget:** Visual tracker showing Step 1 (`SALES_MANAGER`) and Step 2 (`FINANCE`) with checkmarks, timestamps, and actor names.
  - **Line Item Discount Audit Table:** Shows every product line, requested discount %, allowed ceiling %, overage points (e.g. `+8pt`), and financial margin impact in red/green.
  - **Approval Actions Bar:**
    - `Approve Quotation` (Green `#10b981`) → Calls `approveQuotationAction`. Advances Step 1 to Step 2, or marks quote `APPROVED` if final step.
    - `Return for Revision` (Amber) → Opens modal requiring justification note (e.g. *"Discount on Services is too high. Cap at 12%"*). Calls `returnQuotationAction`. Reverts quote to `DRAFT` so rep can edit.
    - `Reject Quotation` (Red `#ef4444`) → Rejects quote and marks stage `REJECTED`.
  - **Audit History Feed:** Running log of every submission, approval, return, and resubmission.

---

### Screen 7: Warehouse Fulfillment & Stock (`/fulfillment`)

- **URL:** `http://localhost:3000/fulfillment`
- **File:** [`src/app/fulfillment/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/fulfillment/page.tsx) & [`src/components/fulfillment/fulfillment-stock-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/fulfillment/fulfillment-stock-view.tsx)
- **Access:** Internal staff (Finance, Admin, Managers, Reps).
- **What's on it:**
  - **Warehouse Stock Inventory Table:** Per-warehouse stock levels across Main Warehouse and East Depot. Shows `In Stock`, `Reserved`, and `Available` stock for each product.
  - **Action Modals:**
    - `+ Add Warehouse` modal → Creates new warehouse with code, name, location, and shipping weight priority.
    - `Update Stock Levels` modal → Adjust stock quantity on hand for any product at any warehouse.
  - **Orders Awaiting Fulfillment Table:** List of confirmed quotations ready for warehouse picking and dispatch.
    - Quote code, Customer, Stage (`Awaiting Allocation`, `Backorder`, `Shipped`).
    - 1-Click `Allocate & Fulfill →` button linking to Screen 8.

---

### Screen 8: Order Allocation & Split Shipments (`/fulfillment/[id]`)

- **URL:** `http://localhost:3000/fulfillment/Q-1042`
- **File:** [`src/app/fulfillment/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/fulfillment/[id]/page.tsx) & [`src/components/fulfillment/warehouse-allocation-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/fulfillment/warehouse-allocation-view.tsx)
- **Access:** Finance & Ops, Admins, Managers.
- **What's on it:**
  - Order details: Customer delivery address, customer delivery date request.
  - **Split Allocation Console:**
    - Evaluates stock availability across warehouses.
    - If Main Warehouse has 1 Laptop and order requires 2, system splits the line:
      - Line 1: `Qty 1` from **Main Warehouse** (Status: `ALLOCATED`).
      - Line 2: `Qty 1` from **East Depot** (Status: `ALLOCATED`).
    - If no warehouse has stock, line status becomes `BACKORDER` with estimated replenishment date.
  - **Shipment Confirmation Button:** `Confirm Warehouse Dispatch` updates order status to `SHIPPED` and notifies customer portal.

---

### Screen 9: Invoices & Payment Reconciliation (`/invoices`)

- **URL:** `http://localhost:3000/invoices`
- **File:** [`src/app/invoices/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/invoices/page.tsx) & [`src/components/invoices/invoices-list-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/invoices/invoices-list-view.tsx)
- **Access:** Internal staff (Finance & Admin have mutation permissions).
- **What's on it:**
  - Accounts Receivable KPI cards: `Total Invoiced`, `Unpaid Balance`, `Paid to Date`, `Overdue Invoices`.
  - Invoices Table:
    - Invoice Number (e.g. `INV-2026-001`).
    - Customer Name & Tier badge.
    - Originating Quote (e.g. `Q-1042`) or Subscription plan.
    - Type (`STANDARD`, `RECURRING`, `CREDIT_NOTE`).
    - Amount.
    - Status badge (`UNPAID`, `PAID`, `OVERDUE`, `CANCELLED`).
    - Due Date.
  - **Quick Action:** 1-Click `Record Payment` modal to mark invoice paid with payment reference.

---

### Screen 9 Detail: Invoice Detail & Printable Bill (`/invoices/[id]`)

- **URL:** `http://localhost:3000/invoices/INV-2026-001`
- **File:** [`src/app/invoices/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/invoices/[id]/page.tsx) & [`src/components/invoices/invoice-detail-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/invoices/invoice-detail-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Formal enterprise invoice document with line-item breakdowns, tax calculations, and payment instructions.
  - Actions:
    - `Print / Export PDF` button.
    - `Record Payment` button (Finance).
    - `Issue Credit Note / Refund` button (Finance).

---

### Screen 10: Subscriptions & Recurring Plans (`/subscriptions`)

- **URL:** `http://localhost:3000/subscriptions`
- **File:** [`src/app/subscriptions/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/subscriptions/page.tsx) & [`src/components/subscriptions/subscriptions-list-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/subscriptions/subscriptions-list-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Recurring Revenue metrics: `Monthly Recurring Revenue (MRR)`, `Active Plans`, `Paused Plans`, `Churn Rate`.
  - Subscriptions Table:
    - Plan Name (e.g. `Care Plan 2yr`, `Cloud Backup Pro`).
    - Customer & Tier.
    - Billing Cycle (`MONTHLY`, `QUARTERLY`, `YEARLY`).
    - Rate per cycle (e.g. `$46.00 / month`).
    - Next Bill Date.
    - Status badge (`ACTIVE`, `PAUSED`, `CANCELLED`).
  - `+ New Subscription` modal to manually provision a recurring plan for any customer.

---

### Screen 10 Detail: Subscription Billing Detail (`/subscriptions/[id]`)

- **URL:** `http://localhost:3000/subscriptions/SUB-101`
- **File:** [`src/app/subscriptions/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/subscriptions/[id]/page.tsx) & [`src/components/subscriptions/subscription-billing-detail-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/subscriptions/subscription-billing-detail-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Subscription plan details, customer billing contact, payment method on file.
  - **Lifecycle Actions:**
    - `Pause Subscription` → Freezes recurring billing.
    - `Resume Subscription` → Re-enables billing cycle.
    - `Cancel Subscription` → Terminates plan.
    - `Generate Next Invoice Now` → Manually fires the next recurring billing cycle and creates an invoice.
  - **Billing History Table:** List of all historical invoices spawned from this subscription.

---

### Screen 11: Customer Portal Negotiation (`/portal/[id]`)

- **URL:** `http://localhost:3000/portal/Q-1042`
- **File:** [`src/app/portal/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/portal/%5Bid%5D/page.tsx) & [`src/components/portal/customer-negotiation-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/portal/customer-negotiation-view.tsx)
- **Access:** Customers (Customer user tied to quote's customer organization) and internal staff previewing via live switcher.
- **What's on it:**
  - Customer-facing quotation proposal with total price, products, and discounts.
  - **Per-Line Negotiation Drawer:**
    - Customer can click `Comment / Counter-Offer` on any order line.
    - Submits counter-discount request (e.g. *"We need 15% on Onsite Setup Service due to budget limits"*).
    - Automatically updates quotation stage to `NEGOTIATION` and alerts Sales Rep.
  - **Delivery Date Request:** Customer can select a preferred delivery arrival date.
  - **Sign & Confirm CTA:**
    - `Accept & Confirm Quotation` button.
    - Moves quotation stage to `CONFIRMED`.
    - Spawns order fulfillment record for warehouse dispatch.

---

### Customer Portal Dashboard (`/portal`)

- **URL:** `http://localhost:3000/portal`
- **File:** [`src/app/portal/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/portal/page.tsx) & [`src/components/portal/customer-portal-dashboard.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/portal/customer-portal-dashboard.tsx)
- **Access:** Customers only (`CUSTOMER` role). Internal users visiting `/portal` are redirected to `/dashboard`.
- **What's on it:**
  - Overview cards: `Active Orders`, `Quotes Under Review`, `Active Subscriptions`, `Outstanding Invoices`.
  - Orders tab: Tracking status of confirmed shipments (`ALLOCATED`, `SHIPPED`, `DELIVERED`).
  - Quotes tab: All proposals awaiting customer review or negotiation.
  - Invoices tab: All customer bills with payment links and download options.

---

### Screen 12: Deal Health Console (`/deal-health`)

- **URL:** `http://localhost:3000/deal-health`
- **File:** [`src/app/deal-health/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/deal-health/page.tsx) & [`src/components/deal-health/deal-health-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/deal-health/deal-health-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Health Summary KPIs: `Total Flagged Deals`, `Stalled Deals (>7 Days Idle)`, `Discount Anomalies`, `Slipped Commitments`.
  - Alerts Table:
    - Quote code, Customer, Owner Rep.
    - Alert Type (`IDLE_STALLED`, `HIGH_DISCOUNT_ANOMALY`, `DELIVERY_SLIPPAGE`).
    - Warning details (e.g. *"Deal idle for 12 days with no customer follow-up"*).
    - **Manager Coaching Actions (Role-Gated for Manager/Admin):**
      - `Nudge Rep` button → Sends a formal notification nudge to the assigned rep to contact customer.
      - `Escalate to Manager` button → Escalates deal to executive review.

---

### Screen 13: Reports & Analytics (`/reports`)

- **URL:** `http://localhost:3000/reports`
- **File:** [`src/app/reports/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/reports/page.tsx) & [`src/components/reports/reports-dashboard-view.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/reports/reports-dashboard-view.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Sales performance metrics: `Total Bookings ($)`, `Average Deal Size`, `Average Approval Time (hrs)`, `Upsell Attachment Rate (%)`.
  - **Rep Discount Overage Table:** Compares discount grant frequency across reps (J. Rao, Sarah Jenkins, David Chen).
  - Category revenue breakdown chart (Hardware vs Services vs Subscriptions).

---

### Screen 14: Products Catalog (`/products`)

- **URL:** `http://localhost:3000/products`
- **File:** [`src/app/products/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/products/page.tsx)
- **Access:** Internal staff.
- **What's on it:**
  - Product list with SKU, Category, Base Price, Stock on Hand, and Subscription badge.
  - Search and category filters.
  - Buttons: `+ New Product` (Screen 15), `Price Lists & Fields` (Screen 17).

---

### Screen 15: Create New Product (`/products/new`)

- **URL:** `http://localhost:3000/products/new`
- **File:** [`src/app/products/new/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/products/new/page.tsx)
- **Access:** Admin only.
- **What's on it:**
  - Product name, category selector (`HARDWARE`, `SERVICES`, `SUBSCRIPTION`), base price, tax %, description.
  - Recurring billing toggle: if enabled, sets default billing cycle (`MONTHLY`, `YEARLY`).
  - Submit creates product record in database.

---

### Screen 16: Product Detail & Variants (`/products/[id]`)

- **URL:** `http://localhost:3000/products/PROD-101`
- **File:** [`src/app/products/[id]/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/products/[id]/page.tsx)
- **Access:** Internal staff (Admin edits).
- **What's on it:**
  - Product specifications and inventory counts across warehouses.
  - **Variants Matrix:** Configuration of variation attributes (e.g. Color: Blue/Black, RAM: 4GB/8GB, Manufacturer: Dell/HP) and extra price additions.

---

### Screen 17: Price Lists & Currency Multipliers (`/products/price-fields`)

- **URL:** `http://localhost:3000/products/price-fields`
- **File:** [`src/app/products/price-fields/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/products/price-fields/page.tsx)
- **Access:** Admin only.
- **What's on it:**
  - Price list definitions linked to Customer Tier and Currency (e.g. Gold Tier USD = 10% base reduction).
  - Currency conversion exchange rates (USD, EUR, GBP).

---

### Screen 18: Discount Tiers & Approval Setup (`/discount-approval-setup`)

- **URL:** `http://localhost:3000/discount-approval-setup` (also aliased at `/approvals/config` and `/settings/discount-rules`)
- **File:** [`src/app/discount-approval-setup/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/discount-approval-setup/page.tsx) & [`src/components/discount-config/discount-config-form.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/components/discount-config/discount-config-form.tsx)
- **Access:** Restricted to `MANAGER` and `ADMIN`. All other users are blocked and redirected to `/unauthorized`.
- **What's on it:**
  - **Customer Tier Ceilings Table:** Editable inputs for Bronze (5%), Silver (10%), and Gold (15%).
  - **Product Category Ceilings Table:** Editable inputs for Hardware (15%), Services (10%), and Subscriptions (15%).
  - **Approval Chain Thresholds Table:** Editable overage point triggers for Medium Risk (Step 1 Manager) and High Risk (Step 1 Manager + Step 2 Finance).
  - **Audit Reason Input:** Textarea for manager to document why policies were changed.
  - **Recent Audit Log Table:** Displays historical changes with timestamp, actor name, and justification.
- **Interactions:**
  - `Save Configuration` button calls `saveDiscountConfigAction`.
  - Re-evaluates all discount limit calculations across the entire system in real time.

---

### Test Harness: Discount Engine Verification (`/test/discount-check`)

- **URL:** `http://localhost:3000/test/discount-check`
- **File:** [`src/app/test/discount-check/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/test/discount-check/page.tsx)
- **Access:** Public developer harness for verifying business rules.
- **What's on it:**
  - Interactive calculator to test any customer tier + product category + discount % combination against live database rules.
  - Displays effective limit, overage points, risk level, and required approvers.

---

### Security Gate: Access Denied (`/unauthorized`)

- **URL:** `http://localhost:3000/unauthorized`
- **File:** [`src/app/unauthorized/page.tsx`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/unauthorized/page.tsx)
- **Access:** Public error handler.
- **What's on it:**
  - Clean Geist warning card: *"403 Access Denied — You do not have sufficient permissions to access this screen."*
  - Button: `Return to Dashboard` (`/dashboard`).

---

## 5. Core Business Logic Engines in Detail

### 5.1 The Stricter Discount Ceiling Rule
Every line item entered on a quotation is validated by [`src/lib/business-logic/discount-limits.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/lib/business-logic/discount-limits.ts).

$$\text{Effective Line Limit} = \min(\text{Customer Tier Ceiling}, \text{Product Category Ceiling})$$

- **Example 1:** Gold Customer (`15%`) + Hardware Product (`15%`) → Limit is **15%**. Rep gives 12% → Status: **OK**.
- **Example 2:** Gold Customer (`15%`) + Services Product (`10%`) → Limit is **10%** (Category is stricter). Rep gives 18% → Status: **OVER (+8pt)**.
- **Example 3:** Bronze Customer (`5%`) + Hardware Product (`15%`) → Limit is **5%** (Tier is stricter). Rep gives 8% → Status: **OVER (+3pt)**.

### 5.2 Blended Risk Score Calculation
Calculated by [`src/lib/business-logic/blended-risk-score.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/lib/business-logic/blended-risk-score.ts):

$$\text{Blended Score} = \frac{\sum (\text{Line Overpoints} \times \text{Line Total})}{\text{Quotation Grand Total}}$$

- If Blended Score $= 0$ → **LOW RISK** (Auto-Approved)
- If $0 < \text{Blended Score} \le 10$ → **MEDIUM RISK** (Manager Step 1 required)
- If $\text{Blended Score} > 10$ → **HIGH RISK** (Manager Step 1 + Finance Step 2 required)

### 5.3 Two-Tier Approval Chains
Enforced by [`src/app/actions/approval-actions.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/actions/approval-actions.ts):

1. **Step 1 (`SALES_MANAGER`):**
   - Must be approved by a user with role `MANAGER` or `ADMIN`.
   - If quote is Medium Risk, signing Step 1 marks the quote **`APPROVED`**.
   - If quote is High Risk, signing Step 1 advances status to `PENDING_STEP_2`.
2. **Step 2 (`FINANCE`):**
   - Unlocked only after Step 1 is completed.
   - Must be approved by a user with role `FINANCE` or `ADMIN`.
   - Once signed, quotation stage becomes **`APPROVED`**.
3. **Return for Revision:**
   - Any approver can return the quote with a mandatory reason note.
   - Quote reverts to `DRAFT`, clearing active approvals and alerting the rep.

### 5.4 Warehouse Allocation & Stock Splits
Managed by [`src/app/actions/fulfillment-actions.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/actions/fulfillment-actions.ts):

- The system evaluates stock across warehouses:
  1. **Single Warehouse Fulfillment:** If one warehouse has full stock, all lines are allocated there.
  2. **Split Shipment Allocation:** If Main Warehouse has 1 unit and East Depot has 1 unit for a 2-unit order, the order is split across both warehouses with separate dispatch tracking.
  3. **Backorder Creation:** If total available stock across all warehouses is insufficient, the unfulfilled quantity is marked `BACKORDER`.

### 5.5 Recurring Subscription Lifecycle & Billing Cycles
Managed by [`src/app/actions/subscription-actions.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/app/actions/subscription-actions.ts):

- When a confirmed quotation contains a recurring subscription line (e.g. Care Plan 2yr at $46/mo):
  1. A `Subscription` record is automatically spawned in `ACTIVE` state.
  2. Initial invoice `INV-2026-001` is generated.
  3. Next bill date is scheduled (`createdAt + 1 month`).
  4. Manually or automatically triggering the billing cycle generates subsequent invoices and updates `nextBillDate`.

### 5.6 Deal Health & Stalled Quotation Engine
Evaluated by [`src/lib/business-logic/deal-health.ts`](file:///C:/Users/Aditya%20Kondekar/Desktop/DealFlow360/src/lib/business-logic/deal-health.ts):

- **Stalled Deals:** Quotes that have remained in `DRAFT` or `NEGOTIATION` for $> 7\text{ days}$ without activity trigger an `IDLE_STALLED` alert.
- **Discount Anomalies:** Quotes whose discount overage exceeds the rep's team historical average trigger a `HIGH_DISCOUNT_ANOMALY` alert.
- **Manager Interventions:** Managers can click `Nudge Rep` or `Escalate`, which logs an actionable coaching audit entry.

---

## 6. End-to-End User Journey Walkthrough (The Q-1042 Lifecycle)

To experience the entire platform in action, follow this canonical 9-step journey:

```
[Step 1: Rep Builds Q-1042] ──► [Step 2: Submit Triggers Approvals]
                                              │
                                              ▼
[Step 4: Finance Step 2 Signoff] ◄── [Step 3: Manager Step 1 Signoff]
            │
            ▼
[Step 5: Customer Negotiates on Portal] ──► [Step 6: Customer Confirms Deal]
                                                        │
                                                        ▼
[Step 8: Invoices & Subscriptions] ◄── [Step 7: Warehouse Fulfillment Split]
            │
            ▼
[Step 9: Finance Reconciles Payment]
```

1. **Rep Builds Deal:** Switch to **J. Rao** (`REP`). Navigate to `/quotations/new`. Select **Acme Corp** (Gold). Add *Laptop Pro 14* (Hardware) with 12% discount (OK). Add *Onsite Setup Service* (Services) with 18% discount (`OVER (+8pt)`). Accept smart upsell for *Extended Warranty* with 10% discount. Blended Risk displays `HIGH RISK`.
2. **Rep Submits Deal:** Click `Submit for Approval`. Status becomes `PENDING_APPROVAL`.
3. **Manager Approves Step 1:** Switch to **M. Shah** (`MANAGER`). Open `/approvals/Q-1042`. Review line item overages. Click `Approve Quotation`. Step 1 checkmark turns green; Step 2 unlocks for Finance.
4. **Finance Approves Step 2:** Switch to **R. Iyer** (`FINANCE`). Open `/approvals/Q-1042`. Review margin impact. Click `Approve Quotation`. Status updates to `APPROVED`.
5. **Customer Negotiates:** Switch to **Acme Corp** (`CUSTOMER`). Open `/portal/Q-1042`. On Line 2 (*Onsite Setup Service*), submit counter-offer: *"We request 15% discount"*. Quote enters `NEGOTIATION`.
6. **Deal Confirmation:** In negotiation drawer, click `Accept & Confirm Quotation`. Quote enters `CONFIRMED`.
7. **Warehouse Split Shipment:** Switch to **R. Iyer** (`FINANCE`). Open `/fulfillment/Q-1042`. Click `Allocate Warehouses`. System allocates 1 Laptop from Main Warehouse and 1 Laptop from East Depot. Click `Confirm Dispatch`.
8. **Invoicing & Recurring Plan:** Invoices page (`/invoices`) displays invoice for $3,030. Subscriptions page (`/subscriptions`) displays Care Plan 2yr ($46/month).
9. **Payment Reconciliation:** On `/invoices`, click `Record Payment`. Status changes to `PAID`. Deal cycle completes.

---

## 7. Quick Navigation & Role Matrix Reference

| Screen Name | Path | Supported Roles | Key Database Models |
| :--- | :--- | :--- | :--- |
| **Login / Sign Up** | `/login` | Public | `User`, `Customer` |
| **Sales Dashboard** | `/dashboard` | `REP`, `MANAGER`, `FINANCE`, `ADMIN` | `Quotation`, `AuditLogEntry`, `DealHealthAlert` |
| **Quotations Pipeline** | `/quotations` | All internal | `Quotation`, `OrderLine`, `Customer` |
| **Quotation Builder** | `/quotations/new` | `REP`, `MANAGER`, `ADMIN` | `Quotation`, `OrderLine`, `Product`, `PriceList` |
| **Quotation Detail** | `/quotations/[id]` | All internal | `Quotation`, `NegotiationComment` |
| **Approvals Queue** | `/approvals` | All internal | `ApprovalStep`, `Quotation` |
| **Approval Signoff Detail** | `/approvals/[id]` | `MANAGER` (Step 1), `FINANCE` (Step 2) | `ApprovalStep`, `AuditLogEntry` |
| **Fulfillment Overview** | `/fulfillment` | All internal (Finance/Admin edit) | `Warehouse`, `StockRecord`, `Fulfillment` |
| **Warehouse Split Console** | `/fulfillment/[id]` | `FINANCE`, `ADMIN` | `Fulfillment`, `FulfillmentLine`, `StockRecord` |
| **Invoices & Payments** | `/invoices` | All internal (Finance/Admin edit) | `Invoice`, `Customer`, `Quotation` |
| **Invoice Detail** | `/invoices/[id]` | All internal | `Invoice`, `CreditNote` |
| **Subscriptions List** | `/subscriptions` | All internal (Finance/Admin edit) | `Subscription`, `Customer` |
| **Subscription Detail** | `/subscriptions/[id]` | All internal | `Subscription`, `Invoice` |
| **Customer Portal Home** | `/portal` | `CUSTOMER` | `Customer`, `Quotation`, `Invoice`, `Subscription` |
| **Customer Negotiation** | `/portal/[id]` | `CUSTOMER` | `Quotation`, `OrderLine`, `NegotiationComment` |
| **Deal Health Console** | `/deal-health` | All internal (Manager/Admin action) | `DealHealthAlert`, `Quotation` |
| **Reports & Analytics** | `/reports` | All internal | `Quotation`, `OrderLine`, `User` |
| **Products Catalog** | `/products` | All internal | `Product`, `ProductCategory` |
| **Create Product** | `/products/new` | `ADMIN` | `Product`, `ProductCategory` |
| **Product Detail & Variants** | `/products/[id]` | All internal (Admin edit) | `Product`, `ProductVariant`, `VariantAttribute` |
| **Price Lists & Multipliers** | `/products/price-fields` | `ADMIN` | `PriceList`, `CustomerTier` |
| **Discount Rules Setup** | `/discount-approval-setup` | `MANAGER`, `ADMIN` | `TierDiscountCeiling`, `CategoryDiscountCeiling`, `ApprovalChainThreshold` |
| **Access Denied Error** | `/unauthorized` | Public | N/A |
| **Discount Engine Tester** | `/test/discount-check` | Public developer harness | Database calculation engine |
