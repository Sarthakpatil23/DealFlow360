# DealFlow360 — Build Steps

Small steps, in order. Each one should be testable before moving to the next.

- [x] 1. **Scaffold Next.js app** (TypeScript, Tailwind, App Router). Test: `npm run dev` loads a blank page.
- [x] 2. **Init Prisma, add schema.prisma** (from `schema.md`). Test: `npx prisma format` runs with no errors.
- [x] 3. **Setup local Postgres via Docker.** Test: `docker ps` shows the container running.
- [x] 4. **Run first migration** (`prisma migrate dev --name init`). Test: tables exist, check with `npx prisma studio`.
- [x] 5. **Write seed.ts** (Acme Corp, sample products, tiers, one warehouse). Test: `npx prisma db seed` populates data, visible in Prisma Studio.
- [ ] 6. **Setup Auth.js Credentials provider + bcrypt.** Test: can log in with a seeded user, session persists on refresh.
- [ ] 7. **Add role-based route protection** (Rep/Manager/Finance/Admin/Customer). Test: logging in as each role redirects to correct area, blocked areas 403/redirect.
- [ ] 8. **Build Login/Signup screen (Screen 1).** Test: bad credentials show error, correct ones log in.
- [ ] 9. **Build Sales Dashboard shell (Screen 2)** with top nav, empty summary cards. Test: nav links route correctly for an internal user.
- [ ] 10. **Build Product Catalog list + detail (Screens 16-17).** Test: create a product with variants and a price list entry, see it saved correctly in DB.
- [ ] 11. **Build Discount Tier & Approval Chain setup (Screen 18).** Test: change Gold's ceiling, confirm the new number is read from DB (not hardcoded) on next check.
- [ ] 12. **Build Warehouse & Stock setup (part of Screen 7 backend).** Test: create a warehouse, set stock, see it reflected in the stock table.
- [ ] 13. **Build Quotation Builder (Screen 4), no discount logic yet.** Test: add lines, quantities, save as Draft, reload and see it persisted.
- [ ] 14. **Implement per-line discount limit check (tier vs category, stricter wins).** Test: enter an over-limit discount, line shows OVER status live.
- [ ] 15. **Implement Blended Discount Risk Score function** (`lib/business-logic/blended-risk-score.ts`). Test: unit test with Q-1042's exact numbers, expect HIGH.
- [ ] 16. **Wire "Submit for Approval" to risk score + auto-approve on LOW.** Test: a fully-within-limit quote skips approval and goes straight to Approved.
- [ ] 17. **Build Approvals List + Approval Detail (Screens 5-6).** Test: Approve/Return/Reject each correctly update stage and log an AuditLogEntry.
- [ ] 18. **Build Quotations List / Kanban (Screen 3).** Test: a quote's card appears in the correct column matching its current stage, updates live after an approval action.
- [ ] 19. **Build Upsell/Cross-sell suggestion panel (Screen 4).** Test: adding a suggestion inserts a real order line and updates the margin total instantly.
- [ ] 20. **Implement warehouse split algorithm** (`lib/business-logic/warehouse-split.ts`). Test: unit test with a quantity split across two warehouses, and one that fully backorders.
- [ ] 21. **Build Fulfillment List + Detail (Screens 7-8).** Test: Accept Suggested Split marks lines fulfilled with correct warehouse/quantity, Manual Override lets you edit it.
- [ ] 22. **Build Subscription creation on order confirm** (Subscription record spins up from a subscription-flagged order line). Test: confirm an order with a subscription line, see it appear in Screen 9.
- [ ] 23. **Implement proration function** (`lib/business-logic/proration.ts`). Test: unit test the worked example ($46→$76 upgrade mid-cycle, expect $15 extra charge).
- [ ] 24. **Build Subscription List + Billing Detail (Screens 9-10), Modify/Cancel actions.** Test: cancel a subscription mid-cycle, confirm a CreditNote is generated with correct amount.
- [ ] 25. **Build Invoice generation on shipment + on subscription cycle** (one-time vs recurring). Test: ship a partial order, confirm only the shipped portion gets invoiced.
- [ ] 26. **Build Invoices List + Invoice Detail (Screens 12-13), Record Payment.** Test: marking Paid updates status and pipeline stage correctly.
- [ ] 27. **Build Customer Portal (Screen 11), restricted to own quotation only.** Test: log in as a customer, confirm you cannot see any other customer's data.
- [ ] 28. **Implement auto re-approval on customer Confirm** (recalculate risk score on final terms). Test: confirm a quote whose final terms are over-limit, confirm it re-enters Screen 6's flow automatically.
- [ ] 29. **Implement Deal Health checks** (stalled, discount anomaly, delivery slippage) + build Screen 14. Test: manually backdate a quote's lastActivityAt, confirm it shows up as Stalled.
- [ ] 30. **Build Reports/Admin dashboard (Screen 15)** with filters + PDF/XLS export. Test: apply a filter, confirm exported file matches filtered data, not the whole dataset.
- [ ] 31. **Full offline run-through.** Turn off wifi, run the entire 8-step test flow from the PS end to end on the actual demo laptop, fix anything that breaks.