"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  Building,
  CreditCard,
  FileText,
} from "lucide-react";

export interface InvoiceListItem {
  id: string;
  displayCode: string;
  customerName: string;
  customerTier: string;
  quotationCode?: string;
  subscriptionPlanName?: string;
  type: "ONE_TIME" | "RECURRING";
  amount: number;
  status: "UNPAID" | "PAID";
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

interface Props {
  initialInvoices: InvoiceListItem[];
}

export function InvoicesListView({ initialInvoices }: Props) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "ONE_TIME" | "RECURRING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const unpaidCount = useMemo(() => {
    return initialInvoices.filter((i) => i.status === "UNPAID").length;
  }, [initialInvoices]);

  const paidCount = useMemo(() => {
    return initialInvoices.filter((i) => i.status === "PAID").length;
  }, [initialInvoices]);

  const totalUnpaidAmount = useMemo(() => {
    return initialInvoices
      .filter((i) => i.status === "UNPAID")
      .reduce((s, i) => s + i.amount, 0);
  }, [initialInvoices]);

  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter((inv) => {
      const matchesStatus = filterStatus === "ALL" || inv.status === filterStatus;
      const matchesType = filterType === "ALL" || inv.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.displayCode.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.quotationCode && inv.quotationCode.toLowerCase().includes(q));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [initialInvoices, filterStatus, filterType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Screen 12 — Invoices
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Every invoice generated from one-time shipments or recurring subscriptions across the whole business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <span className="text-neutral-500">Unpaid Receivables: </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              ${totalUnpaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "ALL"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"
                : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            All ({initialInvoices.length})
          </button>

          <button
            onClick={() => setFilterStatus("UNPAID")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "UNPAID"
                ? "bg-amber-600 text-white border-transparent"
                : "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Unpaid ({unpaidCount})
          </button>

          <button
            onClick={() => setFilterStatus("PAID")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "PAID"
                ? "bg-emerald-600 text-white border-transparent"
                : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid ({paidCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Origin / Plan</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-neutral-400">
                    No invoices matching current filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {inv.displayCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {inv.customerName}
                      </div>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono">
                        {inv.customerTier} TIER
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        {inv.type.replace("_", "-")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {inv.type === "RECURRING" ? (
                        <span>{inv.subscriptionPlanName || "Subscription Cycle"}</span>
                      ) : (
                        <span className="font-mono text-[11px] text-neutral-500">
                          {inv.quotationCode || "Order Shipment"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                      {inv.dueDate}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
