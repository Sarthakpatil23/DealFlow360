"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldAlert,
  Truck,
  AlertTriangle,
  ArrowRight,
  BellRing,
  ArrowUpRight,
  CheckCircle2,
  Building,
  Sparkles,
  Loader2,
} from "lucide-react";
import { DealHealthMetrics, DealHealthItem } from "@/lib/business-logic/deal-health";
import { nudgeRepAction, escalateDealAction } from "@/app/actions/deal-health-actions";

interface Props {
  initialData: DealHealthMetrics;
}

export function DealHealthView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [filterType, setFilterType] = useState<"ALL" | "STALLED" | "DISCOUNT_ANOMALY" | "DELIVERY_SLIPPAGE">("ALL");
  const [actingAlertId, setActingAlertId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredAlerts = data.alerts.filter((a) => {
    if (filterType === "ALL") return true;
    return a.type === filterType;
  });

  // Handle Nudge
  async function handleNudge(alert: DealHealthItem) {
    setActingAlertId(alert.quotationId);
    setNotification(null);

    try {
      const res = await nudgeRepAction(alert.quotationId, alert.alertId);
      if (res.success) {
        setNotification({ type: "success", text: res.message || "Nudge sent!" });
        router.refresh();
      } else {
        setNotification({ type: "error", text: res.error || "Failed to send nudge." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setActingAlertId(null);
    }
  }

  // Handle Escalate
  async function handleEscalate(alert: DealHealthItem) {
    setActingAlertId(alert.quotationId);
    setNotification(null);

    try {
      const res = await escalateDealAction(alert.quotationId, alert.alertId);
      if (res.success) {
        setNotification({ type: "success", text: res.message || "Deal escalated!" });
        router.refresh();
      } else {
        setNotification({ type: "error", text: res.error || "Failed to escalate." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setActingAlertId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Screen 14 — Deal Health & Anomaly Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Catch problems before they quietly kill a deal or blow up margins, without manual babysitting.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* 3 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Stalled Deals */}
        <div
          onClick={() => setFilterType(filterType === "STALLED" ? "ALL" : "STALLED")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterType === "STALLED"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Stalled Deals
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
            {data.stalledCount}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Quotes idle 7+ days with no recent activity
          </p>
        </div>

        {/* Card 2: Discount Anomalies */}
        <div
          onClick={() => setFilterType(filterType === "DISCOUNT_ANOMALY" ? "ALL" : "DISCOUNT_ANOMALY")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterType === "DISCOUNT_ANOMALY"
              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Discount Anomalies
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
            {data.anomaliesCount}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Quotes significantly above rep personal average
          </p>
        </div>

        {/* Card 3: Delivery Slippage */}
        <div
          onClick={() => setFilterType(filterType === "DELIVERY_SLIPPAGE" ? "ALL" : "DELIVERY_SLIPPAGE")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterType === "DELIVERY_SLIPPAGE"
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Delivery Slippage
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
            {data.slippageCount}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Confirmed orders with backorders or delays
          </p>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
            filterType === "ALL"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"
              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
        >
          All Issues ({data.alerts.length})
        </button>

        <button
          onClick={() => setFilterType("STALLED")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
            filterType === "STALLED"
              ? "bg-amber-600 text-white border-transparent"
              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
          }`}
        >
          Stalled ({data.stalledCount})
        </button>

        <button
          onClick={() => setFilterType("DISCOUNT_ANOMALY")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
            filterType === "DISCOUNT_ANOMALY"
              ? "bg-rose-600 text-white border-transparent"
              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
          }`}
        >
          Discount Anomalies ({data.anomaliesCount})
        </button>

        <button
          onClick={() => setFilterType("DELIVERY_SLIPPAGE")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
            filterType === "DELIVERY_SLIPPAGE"
              ? "bg-blue-600 text-white border-transparent"
              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
          }`}
        >
          Delivery Slippage ({data.slippageCount})
        </button>
      </div>

      {/* ANOMALY ALERTS TABLE */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Deal / Account</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4">Flagged</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No active anomalies detected under this filter. All deals healthy.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, idx) => {
                  const isActing = actingAlertId === alert.quotationId;

                  return (
                    <tr
                      key={`${alert.quotationId}-${idx}`}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/quotations/${alert.quotationId}`}
                          className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 font-mono flex items-center gap-1.5"
                        >
                          {alert.displayCode} — {alert.customerName}
                          <ArrowRight className="w-3 h-3 text-neutral-400" />
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                          <span className="uppercase font-mono font-semibold">{alert.customerTier}</span>
                          <span>•</span>
                          <span>${alert.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                          <span>•</span>
                          <span>{alert.stage}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {alert.issueDescription}
                        </div>
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            alert.type === "STALLED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : alert.type === "DISCOUNT_ANOMALY"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {alert.type.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                        {alert.ownerRepName}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-500">
                        {alert.flaggedDate}
                      </td>

                      <td className="py-3.5 px-4">
                        {alert.actionTaken === "NUDGE_SENT" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <BellRing className="w-3 h-3" /> Nudge sent
                          </span>
                        )}
                        {alert.actionTaken === "ESCALATED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                            <ArrowUpRight className="w-3 h-3" /> Escalated to Manager
                          </span>
                        )}
                        {alert.actionTaken === "NONE" && (
                          <span className="text-neutral-400 italic">None yet</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            disabled={isActing}
                            onClick={() => handleNudge(alert)}
                            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-semibold text-[11px] transition-colors"
                          >
                            {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Nudge Rep"}
                          </button>

                          <button
                            disabled={isActing}
                            onClick={() => handleEscalate(alert)}
                            className="px-2.5 py-1 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-[11px] hover:opacity-90 transition-opacity"
                          >
                            Escalate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
