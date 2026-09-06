"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  Sparkles,
  CreditCard,
  Building,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  modifySubscriptionAction,
  cancelSubscriptionAction,
  togglePauseSubscriptionAction,
} from "@/app/actions/subscription-actions";
import { calculateProrationCharge, calculateCancellationCredit } from "@/lib/business-logic/proration";

export interface OneTimeLineItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  amount: number;
}

export interface RecurringLineItem {
  id: string;
  planName: string;
  cycle: string;
  pricePerCycle: number;
  nextBillDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
}

export interface InvoiceHistoryItem {
  id: string;
  displayCode: string;
  type: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

export interface CreditNoteItem {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface SubscriptionBillingDetailData {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  planName: string;
  cycle: string;
  pricePerCycle: number;
  nextBillDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  originatingQuoteCode?: string;
  originatingQuoteId?: string;
  oneTimeLines: OneTimeLineItem[];
  allRecurringPlans: RecurringLineItem[];
  invoices: InvoiceHistoryItem[];
  creditNotes: CreditNoteItem[];
}

interface Props {
  initialData: SubscriptionBillingDetailData;
}

export function SubscriptionBillingDetailView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  // Modals & Action States
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modify form state
  const [newPlanPrice, setNewPlanPrice] = useState(76); // Pre-filled with project.md worked example ($46 -> $76)
  const [customDaysRemaining, setCustomDaysRemaining] = useState(15); // Pre-filled with 15 days of 30

  // Live Proration Calculation preview
  const prorationPreview = calculateProrationCharge(
    data.pricePerCycle,
    Number(newPlanPrice),
    30,
    Number(customDaysRemaining)
  );

  // Live Cancellation Credit preview
  const cancellationPreview = calculateCancellationCredit(
    data.pricePerCycle,
    30,
    Number(customDaysRemaining)
  );

  // 1. Handle Modify
  async function handleModify() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await modifySubscriptionAction(data.subscriptionId, Number(newPlanPrice));
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Subscription updated!" });
        setModifyModalOpen(false);
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to update." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  // 2. Handle Cancel
  async function handleCancel() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await cancelSubscriptionAction(data.subscriptionId, "Customer requested mid-cycle termination");
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Subscription cancelled." });
        setCancelModalOpen(false);
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to cancel." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  // 3. Handle Pause/Resume
  async function handleTogglePause() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await togglePauseSubscriptionAction(data.subscriptionId);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Status updated!" });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to toggle status." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href="/subscriptions" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Subscriptions
            </Link>
            <span>/</span>
            <span>{data.customerName}</span>
            <span>/</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{data.planName}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
              Billing Detail ({data.customerName})
            </h1>

            {data.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
            {data.status === "PAUSED" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <PauseCircle className="w-3.5 h-3.5" /> Paused
              </span>
            )}
            {data.status === "CANCELLED" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                <XCircle className="w-3.5 h-3.5" /> Cancelled
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Separated breakdown of One-Time physical order lines vs Recurring subscription plans, with mid-cycle proration controls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {data.status !== "CANCELLED" && (
            <>
              <button
                onClick={handleTogglePause}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                {data.status === "ACTIVE" ? (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-amber-500" /> Pause Plan
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resume Plan
                  </>
                )}
              </button>

              <button
                onClick={() => setModifyModalOpen(true)}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Modify Subscription
              </button>

              <button
                onClick={() => setCancelModalOpen(true)}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Account Info Pill Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs">
        <div>
          <span className="text-neutral-500 block">Customer Account</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{data.customerName}</span>
          <span className="text-[10px] text-neutral-400 uppercase font-mono block">{data.customerTier} TIER</span>
        </div>

        <div>
          <span className="text-neutral-500 block">Current Plan</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{data.planName}</span>
          <span className="text-[10px] text-neutral-400 block">${data.pricePerCycle.toFixed(2)} / {data.cycle.toLowerCase()}</span>
        </div>

        <div>
          <span className="text-neutral-500 block">Next Billing Date</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {data.status === "PAUSED" ? "— (Paused)" : data.nextBillDate || "—"}
          </span>
        </div>

        <div>
          <span className="text-neutral-500 block">Originating Quotation</span>
          {data.originatingQuoteCode ? (
            <Link
              href={`/quotations/${data.originatingQuoteId || data.originatingQuoteCode}`}
              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              {data.originatingQuoteCode} <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-neutral-400">Manual Setup (Admin)</span>
          )}
        </div>
      </div>

      {/* SECTION 1: ONE-TIME LINES (FROM ORIGINATING ORDER) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              1. One-Time Lines (From Originating Order)
            </h2>
            <p className="text-xs text-neutral-500">
              One-time lines are billed strictly once, tied to physical warehouse shipment.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {data.oneTimeLines.length} item{data.oneTimeLines.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Discount</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {data.oneTimeLines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400">
                    No physical one-time items on this order.
                  </td>
                </tr>
              ) : (
                data.oneTimeLines.map((line) => (
                  <tr key={line.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      {line.productName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-700 dark:text-neutral-300">
                      {line.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                      ${line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-600 dark:text-neutral-400">
                      {line.discountPercent}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      ${line.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: RECURRING LINES (SUBSCRIPTIONS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              2. Recurring Lines
            </h2>
            <p className="text-xs text-neutral-500">
              Recurring lines get billed automatically each cycle until paused or cancelled.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {data.allRecurringPlans.length} plan{data.allRecurringPlans.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Next Bill Date</th>
                <th className="py-3 px-4 text-right">Amount / Cycle</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {data.allRecurringPlans.map((plan) => (
                <tr
                  key={plan.id}
                  className={`hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 ${
                    plan.id === data.subscriptionId ? "bg-blue-50/30 dark:bg-blue-950/10 font-semibold" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    {plan.planName}
                    {plan.id === data.subscriptionId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-mono">
                        SELECTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                    {plan.cycle.charAt(0) + plan.cycle.slice(1).toLowerCase()}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                    {plan.status === "PAUSED" ? "—" : plan.nextBillDate || "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    ${plan.pricePerCycle.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {plan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: INVOICES & CREDIT NOTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Invoices */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Invoices Generated
          </h3>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
                {data.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-400">
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  data.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {inv.displayCode}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-500">
                        {inv.type}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Notes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Refunds & Credit Notes
          </h3>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Credit ID</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Credit Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
                {data.creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-400">
                      No credit notes issued.
                    </td>
                  </tr>
                ) : (
                  data.creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-mono text-neutral-500 truncate max-w-[90px]">
                        {cn.id}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">
                        {cn.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${cn.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: MODIFY SUBSCRIPTION (PRORATION WORKED EXAMPLE) */}
      {modifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Modify Subscription (Mid-Cycle Proration)
              </h3>
              <button
                onClick={() => setModifyModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl p-3.5 text-xs text-sky-900 dark:text-sky-200 space-y-1">
              <span className="font-bold block">Proration Formula (project.md Part 3):</span>
              <p className="font-mono text-[11px]">
                New charge = (New Price − Old Price) × (Days Remaining ÷ Total Days)
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Current Plan Price</label>
                <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  ${data.pricePerCycle.toFixed(2)} / {data.cycle.toLowerCase()}
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  New Plan Price ($)
                </label>
                <input
                  type="number"
                  step="1"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Days Remaining in Cycle (out of 30)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={customDaysRemaining}
                  onChange={(e) => setCustomDaysRemaining(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono font-semibold"
                />
              </div>

              {/* Proration Calculation Box */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Price Difference:</span>
                  <span>+${prorationPreview.priceDifference.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Cycle Fraction Left:</span>
                  <span>{customDaysRemaining} / 30 = {prorationPreview.prorationFraction}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Prorated Charge Now:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +${prorationPreview.proratedCharge.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 italic pt-1">
                  Generates invoice for ${prorationPreview.proratedCharge.toFixed(2)} now. Next billing cycle bills full ${newPlanPrice.toFixed(2)}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModifyModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleModify}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Modification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL SUBSCRIPTION (CREDIT NOTE WORKED EXAMPLE) */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                Cancel Subscription & Issue Credit Note
              </h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Cancelling stops all future recurring billing. For prepaid time that won&apos;t be used, an automatic Credit Note is issued to the customer.
            </p>

            {/* Credit Note Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Current Plan:</span>
                <span>${data.pricePerCycle.toFixed(2)}/mo</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Unused Cycle Days:</span>
                <span>15 of 30 days remaining</span>
              </div>
              <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300 pt-1 border-t border-rose-200 dark:border-rose-900">
                <span>Credit Note Refund:</span>
                <span>${cancellationPreview.creditAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
