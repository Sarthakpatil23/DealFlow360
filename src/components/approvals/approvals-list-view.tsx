"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApprovalsScreenData, ApprovalQueueItem } from "@/lib/approval-data";
import { Sliders, CheckCircle2, Clock, AlertTriangle, ArrowRight, Filter } from "lucide-react";

interface ApprovalsListViewProps {
  initialData: ApprovalsScreenData;
}

export function ApprovalsListView({ initialData }: ApprovalsListViewProps) {
  const router = useRouter();
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

  const displayedItems = filterPendingOnly
    ? initialData.items.filter((item) => item.stage === "PENDING_APPROVAL")
    : initialData.items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Screen 5 — Approvals List
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
            Quotation discount approval queue and multi-tier chain governance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/discount-approval-setup"
            className="inline-flex items-center gap-1.5 border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-[#737373]" />
            Discount Rules (Screen 18)
          </Link>
        </div>
      </div>

      {/* Status Filter Counters matching Screen 5 Wireframe */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <Clock className="h-3.5 w-3.5" />
          <span>{initialData.pendingCount} Pending</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{initialData.returnedCount} Returned</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{initialData.approvedCount} Approved</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterPendingOnly
                ? "bg-[#171717] text-white dark:bg-white dark:text-[#171717] border-transparent"
                : "bg-white dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a1a1a1] border-[#ebebeb] dark:border-[#262626] hover:bg-neutral-50"
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>{filterPendingOnly ? "Showing Pending Only" : "Filter: All Deals"}</span>
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] font-semibold">
                <th className="px-6 py-3.5">Quotation</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Blended Risk</th>
                <th className="px-6 py-3.5">Stage</th>
                <th className="px-6 py-3.5">Assigned To</th>
                <th className="px-6 py-3.5 text-right">Total Value</th>
                <th className="px-6 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {displayedItems.length > 0 ? (
                displayedItems.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/approvals/${q.displayCode}`)}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-[#0070f3] group-hover:underline">
                      {q.displayCode}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{q.customerName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-border">
                          {q.customerTier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          q.blendedRisk === "HIGH"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300"
                            : q.blendedRisk === "MEDIUM"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
                            : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-border"
                        }`}
                      >
                        {q.blendedRisk}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] text-[#737373] dark:text-[#a1a1a1]">
                        {q.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {q.assignedRole !== "—" ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{q.assignedRole}</span>
                          {q.assignedUserName !== "—" && (
                            <span className="text-[10px] text-[#737373] dark:text-[#a1a1a1]">
                              ({q.assignedUserName})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#737373]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">
                      ${q.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ArrowRight className="h-3.5 w-3.5 text-[#8f8f8f] group-hover:text-[#171717] dark:group-hover:text-white transition-colors ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-[#737373]">
                    No quotations found in this queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
