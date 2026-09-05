"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Loader2,
  CreditCard,
  Building,
} from "lucide-react";
import { createManualSubscriptionAction } from "@/app/actions/subscription-actions";
import { RecurringCycle } from "@prisma/client";

export interface SubscriptionItem {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  planName: string;
  cycle: string;
  pricePerCycle: number;
  nextBillDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  originatingQuoteCode?: string;
  createdAt: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  tier: string;
}

interface SubscriptionsListViewProps {
  initialSubscriptions: SubscriptionItem[];
  customers: CustomerOption[];
}

export function SubscriptionsListView({
  initialSubscriptions,
  customers,
}: SubscriptionsListViewProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAUSED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Plan Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [planName, setPlanName] = useState("");
  const [cycle, setCycle] = useState<RecurringCycle>(RecurringCycle.MONTHLY);
  const [pricePerCycle, setPricePerCycle] = useState<number>(46);

  // Status Counts
  const counts = useMemo(() => {
    return {
      active: initialSubscriptions.filter((s) => s.status === "ACTIVE").length,
      paused: initialSubscriptions.filter((s) => s.status === "PAUSED").length,
      cancelled: initialSubscriptions.filter((s) => s.status === "CANCELLED").length,
    };
  }, [initialSubscriptions]);

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    return initialSubscriptions.filter((s) => {
      const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.customerName.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q) ||
        (s.originatingQuoteCode && s.originatingQuoteCode.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [initialSubscriptions, filterStatus, searchQuery]);

  // Handle Manual Plan Creation
  async function handleCreateManualPlan(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await createManualSubscriptionAction({
        customerId: selectedCustomerId,
        planName,
        cycle,
        pricePerCycle: Number(pricePerCycle),
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Subscription created!" });
        setPlanName("");
        setTimeout(() => {
          setModalOpen(false);
          setFeedback(null);
          router.refresh();
        }, 1200);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to create subscription." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Screen 9 — Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Every recurring plan across every customer, regardless of which original order it came from.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          + New Plan (Admin)
        </button>
      </div>

      {/* Filter Pills and Search */}
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
            All ({initialSubscriptions.length})
          </button>

          <button
            onClick={() => setFilterStatus("ACTIVE")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "ACTIVE"
                ? "bg-emerald-600 text-white border-transparent"
                : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active ({counts.active})
          </button>

          <button
            onClick={() => setFilterStatus("PAUSED")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "PAUSED"
                ? "bg-amber-600 text-white border-transparent"
                : "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            Paused ({counts.paused})
          </button>

          <button
            onClick={() => setFilterStatus("CANCELLED")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterStatus === "CANCELLED"
                ? "bg-neutral-600 text-white border-transparent"
                : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelled ({counts.cancelled})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search customer or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Rate / Cycle</th>
                <th className="py-3 px-4">Next Bill</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-400">
                    No subscriptions found. Confirm a quotation with subscription products or click &quot;+ New Plan (Admin)&quot;.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {sub.customerName}
                      </div>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono">
                        {sub.customerTier} TIER
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-neutral-800 dark:text-neutral-200">
                      <div>{sub.planName}</div>
                      {sub.originatingQuoteCode && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          From {sub.originatingQuoteCode}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                      {sub.cycle.charAt(0) + sub.cycle.slice(1).toLowerCase()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      ${sub.pricePerCycle.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                      {sub.status === "PAUSED" ? (
                        <span className="text-neutral-400">—</span>
                      ) : sub.nextBillDate ? (
                        sub.nextBillDate
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      {sub.status === "PAUSED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <PauseCircle className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                      {sub.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                          <XCircle className="w-3 h-3" />
                          Cancelled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Billing Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: + New Plan (Admin) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                + New Plan (Admin)
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleCreateManualPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Customer Account
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-neutral-400"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Care Plan 2yr or Enterprise Support SLA"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value as RecurringCycle)}
                    className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value={RecurringCycle.MONTHLY}>Monthly</option>
                    <option value={RecurringCycle.QUARTERLY}>Quarterly</option>
                    <option value={RecurringCycle.YEARLY}>Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Price Per Cycle ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={pricePerCycle}
                    onChange={(e) => setPricePerCycle(parseFloat(e.target.value))}
                    required
                    className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !planName.trim()}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
