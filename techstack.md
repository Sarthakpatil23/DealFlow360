# DealFlow360 — Tech Stack

Everything below is picked with one constraint above all others: **it must run fully offline on demo day.** Every choice avoids anything that needs a live internet connection at runtime (no CDN-loaded fonts/scripts, no cloud DB, no third-party API calls). Internet is fine to use, and expected, during development/installation only.

---

## Core Framework

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | One process for frontend + backend, `app/` directory, Server Actions to call Prisma directly with minimal boilerplate. |
| Language | **TypeScript** | Catches mistakes in your data shapes (order lines, discount %, etc.) before runtime, matters a lot given how many numeric business rules this project has. |
| Package manager | **npm** | Matches the DB Sync Guide already written; don't mix yarn/pnpm across teammates. |

---

## Database & ORM

| Layer | Choice | Why |
|---|---|---|
| Database | **PostgreSQL**, run locally via Docker | Already decided. Runs fully offline once the container exists. |
| ORM | **Prisma** | Already decided. Handles migrations, type-safe queries, and the schema-sync workflow in `DB_Sync_Guide.md`. |
| Seeding | `prisma/seed.ts` | Pre-populate customers, products, tiers, warehouses so demo doesn't start from an empty DB. |

---

## Authentication

| Layer | Choice | Why |
|---|---|---|
| Auth library | **Auth.js (NextAuth v5)** with the **Credentials provider** | Email+password login works entirely offline, no OAuth provider (Google/GitHub login) needed since those require internet and aren't asked for in the PS. |
| Password hashing | **bcryptjs** | Standard, pure-JS (no native build issues across teammates' machines), works offline. |
| Session storage | **Database session strategy** (Prisma adapter) | Keeps sessions in your own Postgres, no external session store needed. |
| Roles | Custom `role` field on the User model (`REP`, `MANAGER`, `FINANCE`, `ADMIN`, `CUSTOMER`) | Drives which nav items/screens a logged-in user can see (Part 1 of the spec doc). Customers additionally get a `customerId` link to scope them to only their own quotations. |

---

## UI & Styling

| Layer | Choice | Why |
|---|---|---|
| Styling | **Tailwind CSS** | Fast to build 18 screens without writing custom CSS files per page. |
| Component library | **shadcn/ui** | Not an npm dependency, it copies component *code* into your repo when you run its CLI, so once installed it works 100% offline with zero runtime external calls. Gives you Buttons, Tables, Dialogs, Badges, Tabs, etc. matching most of your wireframe elements (pills, cards, buttons) out of the box. |
| Icons | **lucide-react** | Local npm package, no icon CDN. |
| Fonts | **next/font** with a **self-hosted** font (bundled locally, not `next/font/google` pulling live) | `next/font/google` actually downloads and self-hosts at build time so it's safe too, but if you want zero doubt, pick a system font stack or explicitly self-host a font file. |

**Important offline trap to avoid:** don't add a `<link>` to Google Fonts or any CDN script tag directly in `layout.tsx`, that's the one place teams accidentally introduce a live internet dependency without realizing it.

---

## Forms & Validation

| Layer | Choice | Why |
|---|---|---|
| Form handling | **react-hook-form** | Needed for the Quotation Builder (multiple line items), Product Details page (many fields), Discount Tier setup, etc. |
| Validation | **Zod** | Define your business rules as schemas once (e.g., discount % between 0-100, quantity is a positive integer) and reuse the same schema on both the client form and the Server Action for validation, so rules aren't duplicated in two places. |

---

## State Management

| Layer | Choice | Why |
|---|---|---|
| Server state | **React Server Components + Server Actions** (default Next.js pattern) | Most of your data (quotations list, approvals queue, invoices) is just read from Postgres and rendered, no separate client-side data-fetching library needed for that. |
| Client-only interactive state | **Zustand** (lightweight) | Only needed for things that must feel instant without a round-trip, e.g., the live discount/margin indicator updating as a rep types on the Quotation Builder (Screen 4), before the line is actually saved. |

You do not need Redux, React Query/TanStack Query, or SWR for a project this size, they'd add complexity without solving a problem you actually have.

---

## Tables, Lists, and the Kanban Board

| Layer | Choice | Why |
|---|---|---|
| Data tables | **@tanstack/react-table** | Used for Quotations "Table View" (Screen 3), Approvals List (Screen 5), Invoices List (Screen 12), Product Catalog (Screen 16), etc. Handles sorting/filtering without writing that logic yourself. |
| Kanban board (Screen 3) | Plain React, **no drag-and-drop library needed** | Per the spec: cards move columns automatically based on system events (submit, approve, confirm), not by manual dragging. So this is just conditionally rendering cards into columns based on their `stage` field, a drag-and-drop library would be solving a problem you don't have. |

---

## Charts (Deal Health, Reports Dashboard)

| Layer | Choice | Why |
|---|---|---|
| Charts | **Recharts** | Simple React charting library, works fully offline (it's just SVG rendering, no external tile/map service). Good enough for Screen 15's summary cards if you want to add trend charts, and any visual you add to Screen 14. |

---

## PDF and Excel Export

| Layer | Choice | Why |
|---|---|---|
| PDF generation | **@react-pdf/renderer** | Lets you define the exported PDF layout as React components, generates the file entirely server-side/locally, no external PDF service. Needed for Screen 15's "Export PDF" and potentially a quotation summary download. |
| Excel export | **exceljs** | Generates real `.xlsx` files locally for Screen 15's "Export XLS." Avoid `xlsx` (SheetJS) if you can, `exceljs` has a cleaner API for styled sheets, but either works fully offline. |

---

## Dates and Numbers

| Layer | Choice | Why |
|---|---|---|
| Date handling | **date-fns** | Needed constantly: Next Bill Date calculations, "idle 7+ days" stalled-deal checks, proration day-counting (Part 7 of the spec). Lighter than moment.js, works offline, tree-shakeable. |
| Currency formatting | **Intl.NumberFormat** (built into JS, no library needed) | Handles displaying `$1,200`, `€1,080`, etc. without adding a dependency. |

---

## Dev Tooling

| Layer | Choice | Why |
|---|---|---|
| Linting | **ESLint** (Next.js default config) | Comes preconfigured with `create-next-app`. |
| Formatting | **Prettier** | Keep everyone's code style consistent across 4 people editing the same repo. |
| Local DB + container | **Docker Desktop** | Already covered in `DB_Sync_Guide.md`. |
| Git hosting | **GitHub** (private repo) | For pulling/pushing schema migrations and code between teammates. |

---

## What We're Deliberately NOT Using (and why)

| Rejected | Reason |
|---|---|
| Express (separate backend) | Already decided against, adds a second process/server to keep alive offline for no real benefit here. |
| NextAuth OAuth providers (Google/GitHub login) | Requires live internet to reach the provider at login time, breaks offline demo. Use Credentials provider only. |
| Any cloud DB (Neon, Supabase, PlanetScale) | Dead without internet. Local Postgres via Docker only. |
| Redux / React Query / SWR | Unneeded complexity for this project's size, Server Components + Server Actions already cover it. |
| Real payment gateway (Stripe, Razorpay) | "Record Payment" (Screen 13) should be a simple internal status update (mark invoice Paid, log timestamp), not a real live payment integration, both because it needs no internet and because the PS never asks for real money movement. |
| Real currency conversion API | Multi-currency is explicitly a "bonus, not a requirement" in the PS. If you do it at all, use a static/manually-set exchange rate in your DB, not a live API call. |

---

## Suggested Folder Structure

```
dealflow360/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (internal)/                 # Sales rep / manager / finance / admin, behind auth
│   │   │   ├── dashboard/
│   │   │   ├── quotations/
│   │   │   │   └── [id]/
│   │   │   ├── approvals/
│   │   │   │   └── [id]/
│   │   │   ├── fulfillment/
│   │   │   │   └── [id]/
│   │   │   ├── subscriptions/
│   │   │   │   └── [id]/
│   │   │   ├── invoices/
│   │   │   │   └── [id]/
│   │   │   ├── deal-health/
│   │   │   ├── reports/
│   │   │   └── products/
│   │   │       └── [id]/
│   │   ├── (portal)/                   # Customer-only, separately restricted
│   │   │   └── my-quotation/
│   │   └── api/
│   │       └── auth/                   # NextAuth route handler
│   ├── components/
│   │   └── ui/                         # shadcn/ui generated components
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   ├── auth.ts                     # Auth.js config
│   │   └── business-logic/
│   │       ├── blended-risk-score.ts
│   │       ├── warehouse-split.ts
│   │       ├── proration.ts
│   │       └── deal-health-checks.ts
│   └── actions/                        # Server Actions, grouped by feature
│       ├── quotation-actions.ts
│       ├── approval-actions.ts
│       ├── fulfillment-actions.ts
│       ├── subscription-actions.ts
│       └── invoice-actions.ts
├── .env
└── package.json
```

**Why `lib/business-logic/` is its own folder:** the four hardest rules in this whole project (blended risk score, warehouse split, proration, deal health checks) deserve to be plain, isolated, well-tested functions, not logic scattered inline inside Server Actions or React components. This also matches the PS's own requirement: *"Core business rules must be implemented in application logic, not hardcoded or faked for the demo."* Keeping them as pure functions also makes them trivial to unit test if you have time.

---

## Full Install Command List (run once, project already scaffolded)

```bash
npx create-next-app@latest dealflow360 --typescript --tailwind --app
cd dealflow360

npm install prisma @prisma/client
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install react-hook-form zod @hookform/resolvers
npm install zustand
npm install @tanstack/react-table
npm install recharts
npm install @react-pdf/renderer exceljs
npm install date-fns
npm install lucide-react

npx prisma init
npx shadcn@latest init
```

(Individual `shadcn` components, e.g. button, table, dialog, badge, tabs, get added one at a time later with `npx shadcn@latest add button` etc., as you actually need them, no need to install all of them upfront.)

---

## Offline-Safety Checklist (re-check before finale day)

- [ ] No `<link>` or `<script>` tag in any layout/page pointing to an external CDN
- [ ] `DATABASE_URL` points to `localhost`, not any cloud host
- [ ] No OAuth login buttons wired up (Credentials provider only)
- [ ] No live API calls for currency conversion, payment processing, or maps
- [ ] Full app tested once with wifi turned off, start to finish, on the actual presentation laptop