"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
  Building,
  Calendar,
  FileText,
  Truck,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { recordInvoicePaymentAction } from "@/app/actions/invoice-actions";

export interface InvoiceDetailItem {
  id: string;
  displayCode: string;
  type: "ONE_TIME" | "RECURRING";
  amount: number;
  status: "UNPAID" | "PAID";
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  quotationId?: string;
  quotationCode?: string;
  quotationStage?: string;
  subscriptionId?: string;
  subscriptionPlanName?: string;
  isShipped: boolean;
  relatedInvoices: {
    id: string;
    displayCode: string;
    type: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
}

interface Props {
  initialInvoice: InvoiceDetailItem;
}

export function InvoiceDetailView({ initialInvoice }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isPaid = invoice.status === "PAID";
  const isShipped = invoice.isShipped || invoice.type === "RECURRING";
  const isOrderConfirmed = Boolean(invoice.quotationCode || invoice.subscriptionPlanName);

  // Handle Record Payment
  async function handleRecordPayment() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await recordInvoicePaymentAction(invoice.id);
      if (res.success) {
        setInvoice({
          ...invoice,
          status: "PAID",
          paidAt: new Date().toLocaleDateString(),
        });
        setStatusMessage({ type: "success", text: res.message || "Payment recorded successfully!" });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to record payment." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  // Handle Download Summary
  function handleDownloadSummary() {
    const summaryText = `
========================================
       DEALFLOW360 INVOICE SUMMARY
========================================
Invoice Code:  ${invoice.displayCode}
Date Issued:   ${invoice.createdAt}
Due Date:      ${invoice.dueDate}
Status:        ${invoice.status} ${invoice.paidAt ? `(Paid on ${invoice.paidAt})` : ""}
Type:          ${invoice.type}

Customer:      ${invoice.customerName} (${invoice.customerTier} Tier)
Quotation:     ${invoice.quotationCode || "N/A"}
Plan:          ${invoice.subscriptionPlanName || "One-Time Delivery"}

Total Invoiced: $${invoice.amount.toFixed(2)} USD
========================================
Thank you for doing business with DealFlow360!
    `.trim();

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.displayCode}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href="/invoices" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Invoices
            </Link>
            <span>/</span>
            <span>{invoice.customerName}</span>
            <span>/</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{invoice.displayCode}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
              Invoice Detail ({invoice.displayCode})
            </h1>

            {isPaid ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5" /> Unpaid
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track invoice lifecycle from order confirmation and warehouse shipment to settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSummary}
            className="px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download Summary
          </button>

          {!isPaid && (
            <button
              onClick={handleRecordPayment}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Record Payment
            </button>
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

      {/* Canonical Spec Banner: Partial invoicing stays reconciled */}
      <div className="bg-sky-50 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 dark:text-sky-200 space-y-0.5">
          <span className="font-bold block">Partial Invoicing Rule:</span>
          <p>
            &quot;Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.&quot;
            An invoice for physical goods is only generated once that portion of the order has actually shipped from a warehouse.
          </p>
        </div>
      </div>

      {/* HORIZONTAL STATUS PIPELINE */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Invoice Lifecycle Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {/* Step 1: Order Confirmed */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isOrderConfirmed
                ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400">01</span>
              {isOrderConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
              Order Confirmed
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {invoice.quotationCode ? `Quotation ${invoice.quotationCode}` : "Direct Subscription"}
            </p>
          </div>

          {/* Step 2: Shipped */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isShipped
                ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400">02</span>
              {isShipped ? (
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
              Shipped
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {invoice.type === "RECURRING" ? "Subscription Billing Cycle" : "Warehouse Dispatched"}
            </p>
          </div>

          {/* Step 3: Invoiced */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400">03</span>
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
              Invoiced
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-mono font-semibold">
              {invoice.displayCode} (${invoice.amount.toFixed(2)})
            </p>
          </div>

          {/* Step 4: Paid */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isPaid
                ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400">04</span>
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
              Paid
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {isPaid ? `Settled on ${invoice.paidAt}` : "Pending Payment Record"}
            </p>
          </div>
        </div>
      </div>

      {/* INVOICE DETAILS AND LINKED INVOICES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Invoice Spec Card */}
        <div className="md:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <span className="font-mono text-xs font-bold text-neutral-400">INVOICE SPECIFICATION</span>
            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
              Due: {invoice.dueDate}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-500 block">Customer Account</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {invoice.customerName}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                {invoice.customerTier} TIER
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block">Billing Category</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {invoice.type === "ONE_TIME" ? "One-Time Order Shipment" : "Recurring Subscription"}
              </span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                {invoice.subscriptionPlanName || invoice.quotationCode}
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block">Total Invoiced</span>
              <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 block">
                ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block">Payment Status</span>
              <span
                className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {invoice.status} {invoice.paidAt ? `• Paid ${invoice.paidAt}` : "• Due Soon"}
              </span>
            </div>
          </div>

          {invoice.quotationCode && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-500">Originating Quotation:</span>
              <Link
                href={`/quotations/${invoice.quotationId || invoice.quotationCode}`}
                className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                {invoice.quotationCode} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right 1 Col: Related Customer Invoices */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Linked Customer Invoices
          </h3>

          <div className="space-y-2 text-xs">
            {invoice.relatedInvoices.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-4">
                No other invoices for this customer.
              </p>
            ) : (
              invoice.relatedInvoices.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/invoices/${rel.id}`}
                  className={`block p-2.5 rounded-lg border transition-all ${
                    rel.id === invoice.id
                      ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {rel.displayCode}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      ${rel.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1">
                    <span>{rel.type}</span>
                    <span className={rel.status === "PAID" ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {rel.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
