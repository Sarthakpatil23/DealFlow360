"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  Building,
  MessageSquare,
} from "lucide-react";

export interface QuotationSummaryItem {
  id: string;
  displayCode: string;
  customerName: string;
  customerTier: string;
  ownerRepName: string;
  stage: string;
  blendedRisk: string | null;
  currency: string;
  itemCount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface QuotationPipelineViewProps {
  initialQuotations: QuotationSummaryItem[];
}

const STAGES: { key: string; label: string; description: string; color: string; border: string; bg: string }[] = [
  {
    key: "DRAFT",
    label: "Draft",
    description: "Rep building quote",
    color: "text-neutral-700 dark:text-neutral-300",
    border: "border-neutral-300 dark:border-neutral-700",
    bg: "bg-neutral-100 dark:bg-neutral-800/60",
  },
  {
    key: "PENDING_APPROVAL",
    label: "Pending Approval",
    description: "In manager/finance chain",
    color: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    key: "APPROVED",
    label: "Approved",
    description: "Cleared all approvals",
    color: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    key: "NEGOTIATION",
    label: "Negotiation",
    description: "Customer reviewing in portal",
    color: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-700",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    description: "Customer agreed — order created",
    color: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

export function QuotationPipelineView({ initialQuotations }: QuotationPipelineViewProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRejected, setShowRejected] = useState(false);

  // Filter items by search query
  const filteredQuotations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialQuotations;
    return initialQuotations.filter(
      (item) =>
        item.displayCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.ownerRepName.toLowerCase().includes(q) ||
        item.stage.toLowerCase().includes(q)
    );
  }, [initialQuotations, searchQuery]);

  // Overall pipeline metrics
  const totalPipelineValue = useMemo(() => {
    return filteredQuotations.reduce((sum, item) => sum + item.totalValue, 0);
  }, [filteredQuotations]);

  const rejectedCount = useMemo(() => {
    return filteredQuotations.filter((item) => item.stage === "REJECTED").length;
  }, [filteredQuotations]);

  return (
    <div className="space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Screen 3 — Quotations Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            See every deal in the system grouped by stage. Cards move automatically as quotes are submitted, approved, and confirmed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </Link>
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by quote code, customer or rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        {/* Pipeline Summary Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-medium">
            <span className="text-neutral-500">Pipeline Total: </span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              ${totalPipelineValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-neutral-400 ml-1.5">({filteredQuotations.length} deals)</span>
          </div>

          {rejectedCount > 0 && (
            <button
              onClick={() => setShowRejected(!showRejected)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showRejected
                  ? "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {showRejected ? "Hide" : "Show"} Rejected ({rejectedCount})
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const columnItems = filteredQuotations.filter((item) => item.stage === col.key);
            const columnTotal = columnItems.reduce((acc, item) => acc + item.totalValue, 0);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`p-3 border-b rounded-t-xl ${col.bg} ${col.border}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold tracking-wide uppercase ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      {columnItems.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {col.description}
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">
                      ${columnTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2.5 flex-1 flex flex-col">
                  {columnItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400 text-xs italic">
                      No quotes in this stage
                    </div>
                  ) : (
                    columnItems.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/quotations/${quote.id}`}
                        className="group block p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all hover:shadow-xs"
                      >
                        {/* Quote Code & Risk Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {quote.displayCode}
                          </span>
                          {quote.blendedRisk === "HIGH" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                              <ShieldAlert className="w-3 h-3" />
                              HIGH
                            </span>
                          )}
                          {quote.blendedRisk === "MEDIUM" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              MED
                            </span>
                          )}
                          {quote.blendedRisk === "LOW" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <ShieldCheck className="w-3 h-3" />
                              LOW
                            </span>
                          )}
                          {quote.stage === "NEGOTIATION" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                              <MessageSquare className="w-3 h-3" />
                              Counter
                            </span>
                          )}
                        </div>

                        {/* Customer & Tier */}
                        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 mb-2">
                          <span className="font-medium truncate max-w-[130px]">{quote.customerName}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-500">
                            {quote.customerTier}
                          </span>
                        </div>

                        {/* Value and Line items */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                          <div>
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              ${quote.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              {quote.itemCount} line item{quote.itemCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transform group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Optional Rejected Column if active */}
          {showRejected && (
            <div className="flex flex-col rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 min-h-[500px]">
              <div className="p-3 border-b border-rose-200 dark:border-rose-900 bg-rose-100/50 dark:bg-rose-950/40 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide uppercase text-rose-700 dark:text-rose-400">
                    Rejected / Dead
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-neutral-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {rejectedCount}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2.5 flex-1">
                {filteredQuotations
                  .filter((item) => item.stage === "REJECTED")
                  .map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/quotations/${quote.id}`}
                      className="group block p-3.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-neutral-900 hover:border-rose-400 opacity-75 hover:opacity-100 transition-all"
                    >
                      <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {quote.displayCode}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {quote.customerName}
                      </div>
                      <div className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                        ${quote.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4">Owner Rep</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-400">
                      No quotations found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {q.displayCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                        {q.customerName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded font-semibold border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                          {q.customerTier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {q.stage.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {q.blendedRisk === "HIGH" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            HIGH
                          </span>
                        )}
                        {q.blendedRisk === "MEDIUM" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            MEDIUM
                          </span>
                        )}
                        {q.blendedRisk === "LOW" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            LOW
                          </span>
                        )}
                        {!q.blendedRisk && <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-600 dark:text-neutral-400">
                        {q.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                        ${q.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {q.ownerRepName}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
