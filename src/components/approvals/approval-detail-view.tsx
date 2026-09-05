"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApprovalDetailData } from "@/lib/approval-data";
import {
  approveQuotationAction,
  returnQuotationAction,
  rejectQuotationAction,
} from "@/app/actions/approval-actions";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  Info,
  Clock,
  User,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ApprovalDetailViewProps {
  initialData: ApprovalDetailData;
}

export function ApprovalDetailView({ initialData }: ApprovalDetailViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ApprovalDetailData>(initialData);
  const [loading, setLoading] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /**
   * 1. Approve Quotation
   */
  async function handleApprove() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await approveQuotationAction(data.quotationId);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Approved successfully!" });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Approval failed." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  /**
   * 2. Return for Revision
   */
  async function handleReturn() {
    if (!returnNote.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a justification note to return." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await returnQuotationAction(data.quotationId, returnNote.trim());
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Returned to rep." });
        setReturnModalOpen(false);
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to return." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  /**
   * 3. Reject Quotation
   */
  async function handleReject() {
    if (!confirm(`Are you sure you want to mark quotation ${data.displayCode} as Rejected?`)) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await rejectQuotationAction(data.quotationId, "Rejected by approver");
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Quotation rejected." });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to reject." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-[#737373] dark:text-[#a1a1a1]">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/approvals" className="hover:underline">
              Approvals
            </Link>
            <span>/</span>
            <span className="font-mono text-[#171717] dark:text-[#ededed] font-medium">
              {data.displayCode}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
              Screen 6 — Approval Detail ({data.displayCode})
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                data.stage === "APPROVED"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                  : data.stage === "PENDING_APPROVAL"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-border"
              }`}
            >
              {data.stage}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
            Customer: <strong className="text-[#171717] dark:text-[#ededed] font-semibold">{data.customerName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Queue
          </Link>
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Screen 6 Badges & Metric Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            data.blendedRisk === "HIGH"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300"
              : data.blendedRisk === "MEDIUM"
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Blended Risk: {data.blendedRisk}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-border">
          <span>Customer Tier: {data.customerTier}</span>
        </div>

        {data.worstLineOverage > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200">
            <span>Worst Line Overage: +{data.worstLineOverage} points</span>
          </div>
        )}
      </div>

      {/* Visual Approval Pipeline Tracker */}
      <div className="p-5 rounded-xl border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-2xs">
        <h3 className="text-xs font-semibold text-[#737373] dark:text-[#a1a1a1] uppercase tracking-wider mb-4">
          Approval Chain Pipeline
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Step 1: Submitted */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="font-semibold block text-[#171717] dark:text-[#ededed]">Submitted</span>
              <span className="text-[11px] text-[#737373]">Sales Rep</span>
            </div>
          </div>

          <div className="hidden sm:block h-px flex-1 bg-border/60 mx-2" />

          {/* Step 2: Sales Manager */}
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                data.steps.find((s) => s.role === "SALES_MANAGER")?.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : data.stage === "PENDING_APPROVAL"
                  ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {data.steps.find((s) => s.role === "SALES_MANAGER")?.status === "APPROVED" ? "✓" : "1"}
            </div>
            <div>
              <span className="font-semibold block text-[#171717] dark:text-[#ededed]">Sales Manager</span>
              <span className="text-[11px] text-[#737373]">M. Shah</span>
            </div>
          </div>

          <div className="hidden sm:block h-px flex-1 bg-border/60 mx-2" />

          {/* Step 3: Finance (if HIGH risk) */}
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                data.steps.find((s) => s.role === "FINANCE")?.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : data.blendedRisk === "HIGH" && data.stage === "PENDING_APPROVAL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {data.steps.find((s) => s.role === "FINANCE")?.status === "APPROVED" ? "✓" : "2"}
            </div>
            <div>
              <span className="font-semibold block text-[#171717] dark:text-[#ededed]">Finance Approver</span>
              <span className="text-[11px] text-[#737373]">R. Iyer</span>
            </div>
          </div>

          <div className="hidden sm:block h-px flex-1 bg-border/60 mx-2" />

          {/* Step 4: Approved / Confirmed */}
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                data.stage === "APPROVED" || data.stage === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {data.stage === "APPROVED" || data.stage === "CONFIRMED" ? "✓" : "4"}
            </div>
            <div>
              <span className="font-semibold block text-[#171717] dark:text-[#ededed]">Confirmed Order</span>
              <span className="text-[11px] text-[#737373]">Fulfillment & Billing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Why This Quote Was Flagged */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] dark:border-[#262626] bg-[#fcfcfc] dark:bg-[#0d0d0d]">
          <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
            Why This Quote Was Flagged
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
            Frozen line-item review. Stricter of customer tier vs product category ceiling determines limit.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] font-semibold">
                <th className="px-6 py-3">Product Line</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Discount Given</th>
                <th className="px-6 py-3">Limit Allowed</th>
                <th className="px-6 py-3 text-right">Over By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {data.flaggedLines.map((line) => (
                <tr
                  key={line.id}
                  className={`hover:bg-neutral-50/50 dark:hover:bg-[#141414] ${
                    line.overByPoints > 0 ? "bg-rose-50/30 dark:bg-rose-950/10" : ""
                  }`}
                >
                  <td className="px-6 py-3.5 font-medium">{line.productName}</td>
                  <td className="px-6 py-3.5 text-[#737373]">{line.category}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold">{line.discountGiven}%</td>
                  <td className="px-6 py-3.5 font-mono text-[#737373]">{line.limitAllowed}%</td>
                  <td className="px-6 py-3.5 text-right font-mono">
                    {line.overByPoints > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300">
                        +{line.overByPoints}pt OVER
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">0pt, OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wireframe Explanatory Callout Banner */}
      <div className="rounded-xl border border-amber-400/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-[#1a1506] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 shadow-2xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p>
          Worst single line (+{data.worstLineOverage}pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require approval.
        </p>
      </div>

      {/* Immutable Audit Trail Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] dark:border-[#262626] bg-[#fcfcfc] dark:bg-[#0d0d0d]">
          <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
            Audit Trail (Append-Only Log)
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
            Immutable log of all submission, approval, revision, and rejection events.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] font-semibold">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {data.auditTrail.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#141414]">
                  <td className="px-6 py-3 font-medium flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#737373]" />
                    <span>{entry.userName}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-border">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-[#737373]">{entry.date}</td>
                  <td className="px-6 py-3 text-[#737373] dark:text-[#a1a1a1]">{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons: Approve, Return for Revision, Reject OR Role Status Notice */}
      {data.canApprove ? (
        <div className="flex flex-wrap items-center justify-end gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>

          <button
            type="button"
            onClick={() => setReturnModalOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#171717] dark:text-[#ededed] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border border-border transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Return for Revision
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve Quotation
          </button>
        </div>
      ) : data.statusNotice ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] shadow-2xs">
          <Info className="h-4 w-4 text-neutral-500 flex-shrink-0" />
          <p className="font-medium">{data.statusNotice}</p>
        </div>
      ) : null}

      {/* Return for Revision Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Return Quotation for Revision
            </h3>
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for the sales rep (e.g. &quot;Requested justification for 18% service discount&quot;).
            </p>

            <textarea
              rows={3}
              required
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="e.g. Requested justification for line discount..."
              className="w-full rounded-lg border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturn}
                disabled={loading || !returnNote.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Return to Rep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
