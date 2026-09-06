"use client";

import React from "react";
import Link from "next/link";
import { RecentActivityItem } from "@/lib/dashboard-data";
import {
  Activity,
  CheckCircle2,
  Send,
  RotateCcw,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Recently";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActionBadge(action?: string) {
  switch (action) {
    case "APPROVED":
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        label: "Approved",
      };
    case "SUBMITTED":
      return {
        icon: <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
        badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        label: "Submitted",
      };
    case "RETURNED_FOR_REVISION":
      return {
        icon: <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        label: "Revision",
      };
    case "REJECTED":
      return {
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
        badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
        label: "Rejected",
      };
    case "RESUBMITTED":
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
        badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        label: "Resubmitted",
      };
    default:
      return {
        icon: <FileText className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />,
        badgeClass: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/20",
        label: "Logged",
      };
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section
      className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6 shadow-2xs space-y-4 font-sans"
      aria-labelledby="recent-activity-title"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="recent-activity-title"
                className="text-base font-semibold text-[#171717] dark:text-[#ededed]"
              >
                Recent Pipeline Activity
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Audit Log
              </span>
            </div>
            <p className="text-xs text-[#737373] dark:text-[#a1a1a1]">
              Audit trail of quotation submissions, manager approvals, revisions, and status transitions
            </p>
          </div>
        </div>

        <Link
          href="/approvals"
          className="text-xs font-medium text-[#0070f3] hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
        >
          View Approvals Queue <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Activity Timeline List */}
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
          No recent activity recorded yet. Live audit logs and approval events will appear here automatically.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {activities.map((item) => {
            const badge = getActionBadge(item.action);

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${badge.badgeClass}`}
                  >
                    {badge.icon}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.text}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-xl italic">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pl-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                    {formatRelativeTime(item.timestamp)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
