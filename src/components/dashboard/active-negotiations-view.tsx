"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Tag,
  Building,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ActiveNegotiationItem } from "@/lib/dashboard-data";

interface ActiveNegotiationsViewProps {
  negotiations: ActiveNegotiationItem[];
  userRole?: string;
}

export function ActiveNegotiationsView({
  negotiations,
  userRole,
}: ActiveNegotiationsViewProps) {
  if (!negotiations || negotiations.length === 0) {
    return (
      <section
        aria-label="Active Customer Negotiations"
        className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-2xs space-y-3 font-sans"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">
                Active Customer Negotiations
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a1a1a1]">
                Customer counter-discounts and terms awaiting rep review or approval escalation
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
            0 active
          </span>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
          No quotations are currently under customer negotiation. When a customer counters on Screen 11, their proposed discounts and notes will appear here immediately.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Active Customer Negotiations"
      className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6 shadow-2xs space-y-5 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">
                Active Customer Negotiations
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                {negotiations.length} Pending Action
              </span>
            </div>
            <p className="text-xs text-[#737373] dark:text-[#a1a1a1]">
              Customer counter-discounts and terms awaiting rep review or approval escalation
            </p>
          </div>
        </div>

        <Link
          href="/quotations"
          className="text-xs font-medium text-[#0070f3] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          View Kanban Pipeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Active Negotiation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {negotiations.map((item) => {
          const hasOverLimit = item.requiresEscalation;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-3.5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Top: Code, Customer, Tier, Authority Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={item.href}
                        className="font-mono font-bold text-sm text-[#0070f3] hover:underline"
                      >
                        {item.displayCode}
                      </Link>
                      <span className="text-neutral-400">·</span>
                      <span className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">
                        {item.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 font-mono text-neutral-600 dark:text-neutral-300">
                        {item.customerTier} Tier
                      </span>
                      {item.totalGross > 0 && (
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                          ${item.totalGross.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Authority / Escalation Badge */}
                  {hasOverLimit ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      Requires Manager Signoff (+{item.maxOveragePoints}pt)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Rep Authorized (Within Limits)
                    </span>
                  )}
                </div>

                {/* Line Items Counter Asks */}
                <div className="rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-[#0a0a0a] p-2.5 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer Counter Proposals
                  </div>
                  {item.lines.slice(0, 3).map((l, lIdx) => (
                    <div
                      key={lIdx}
                      className="flex items-center justify-between text-xs py-1 border-b last:border-b-0 border-neutral-100 dark:border-neutral-900"
                    >
                      <span className="font-medium text-[#171717] dark:text-[#ededed] truncate max-w-[140px]">
                        {l.productName}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-neutral-400 line-through text-[11px]">
                          {l.originalDiscountPercent}%
                        </span>
                        <span className="text-neutral-400">→</span>
                        <span
                          className={`font-bold ${
                            l.isOverLimit
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {l.requestedDiscountPercent}% ask
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (limit {l.effectiveLimitPercent}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {item.lines.length > 3 && (
                    <div className="text-[10px] text-neutral-400 text-center pt-0.5">
                      +{item.lines.length - 3} more item(s)
                    </div>
                  )}
                </div>

                {/* Customer Comment & Delivery Date */}
                {(item.latestComment || item.requestedDeliveryDate) && (
                  <div className="space-y-1 text-xs">
                    {item.latestComment && (
                      <div className="italic text-[#737373] dark:text-[#a1a1a1] bg-neutral-100 dark:bg-neutral-800/60 p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                        &quot;{item.latestComment}&quot;
                      </div>
                    )}
                    {item.requestedDeliveryDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        Requested Delivery: {new Date(item.requestedDeliveryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">
                  {item.updatedAt ? `Updated ${item.updatedAt}` : "Awaiting response"}
                </span>

                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0070f3] hover:bg-[#0761d1] text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <span>Review & Respond</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
