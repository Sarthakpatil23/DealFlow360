"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  AlertTriangle,
  Calendar,
  Building,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { submitNegotiationRequestAction } from "@/app/actions/negotiation-actions";
import { confirmQuotationAction } from "@/app/actions/quotation-actions";

export interface PortalOrderLine {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  amount: number;
}

export interface PortalCommentItem {
  id: string;
  productName?: string;
  commentText: string;
  counterDiscountPercent?: number | null;
  authorName: string;
  createdAt: string;
}

export interface PortalQuotationData {
  id: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  stage: string;
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  orderLines: PortalOrderLine[];
  comments: PortalCommentItem[];
}

interface Props {
  initialData: PortalQuotationData;
}

export function CustomerNegotiationView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  // Line comment and counter discount state
  const [lineComments, setLineComments] = useState<Record<string, string>>({});
  const [lineCounters, setLineCounters] = useState<Record<string, number | "">>({});
  const [requestedDate, setRequestedDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const isConfirmed = data.stage === "CONFIRMED";
  const isPendingApproval = data.stage === "PENDING_APPROVAL";

  // Handle Submit Request
  async function handleSubmitRequest() {
    setLoading(true);
    setFeedback(null);

    try {
      const payload = data.orderLines.map((line) => ({
        orderLineId: line.id,
        commentText: lineComments[line.id] || "",
        counterDiscountPercent:
          lineCounters[line.id] !== "" && lineCounters[line.id] !== undefined
            ? Number(lineCounters[line.id])
            : undefined,
      }));

      const res = await submitNegotiationRequestAction(data.id, payload, requestedDate || undefined);

      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Negotiation request submitted! Your sales rep will review your proposal.",
        });
        setData({ ...data, stage: "NEGOTIATION" });
        setLineComments({});
        setLineCounters({});
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to submit negotiation request." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  // Handle Confirm Quotation (Step 28: Auto re-approval check)
  async function handleConfirmQuotation() {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await confirmQuotationAction(data.id);

      if (res.success) {
        if (res.reapprovalRequired) {
          setData({ ...data, stage: "PENDING_APPROVAL" });
          setFeedback({
            type: "info",
            text: res.message || "Final agreed terms exceed discount thresholds and have automatically re-entered the approval flow.",
          });
        } else {
          setData({ ...data, stage: "CONFIRMED" });
          setFeedback({
            type: "success",
            text: res.message || "Quotation confirmed! Your order has been placed and sent to fulfillment.",
          });
        }
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to confirm quotation." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Portal Top Mini Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-white pb-2">
            My Quotation ({data.displayCode})
          </span>
          <span className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 pb-2 cursor-pointer">
            Messages ({data.comments.length})
          </span>
          <span className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 pb-2 cursor-pointer">
            Profile & Billing
          </span>
        </div>

        <div className="flex items-center gap-2">
          {data.stage === "CONFIRMED" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Order Confirmed
            </span>
          )}
          {data.stage === "NEGOTIATION" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              <MessageSquare className="w-3.5 h-3.5" /> Under Negotiation
            </span>
          )}
          {data.stage === "PENDING_APPROVAL" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" /> Re-approval In Progress
            </span>
          )}
          {data.stage === "APPROVED" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved — Ready to Confirm
            </span>
          )}
        </div>
      </div>

      {/* Screen Title & Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Screen 11 — Customer Portal Negotiation ({data.displayCode})
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review your personalized proposal. You may comment on specific lines, suggest a counter-discount, or confirm the quote as final.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : feedback.type === "info"
              ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Canonical Spec Banner: Auto re-approval rule */}
      <div className="bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-800/60 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900 dark:text-purple-200 space-y-0.5">
          <span className="font-bold block">Negotiation & Re-Approval Rule (project.md Screen 11):</span>
          <p>
            &quot;If final terms exceed thresholds, the quote automatically re-enters approval (Screen 6).&quot;
            When you confirm a quotation with counter-discounts above the ceiling, our system automatically routes it to management for re-approval before finalizing your order.
          </p>
        </div>
      </div>

      {/* Line-Level Comment & Counter Discount Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Quotation Line Items & Counter-Proposal
          </h2>
          <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {data.orderLines.length} line items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Product Line</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Current Discount</th>
                <th className="py-3 px-4 text-center">Counter Discount %</th>
                <th className="py-3 px-4">Customer Comment</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:border-neutral-800">
              {data.orderLines.map((line) => (
                <tr key={line.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    <div>{line.productName}</div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">
                      {line.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-neutral-700 dark:text-neutral-300">
                    {line.quantity}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                    ${line.unitPrice.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {line.discountPercent}%
                    </span>
                  </td>

                  {/* Counter Discount % Input */}
                  <td className="py-3.5 px-4 text-center">
                    {!isConfirmed ? (
                      <div className="inline-flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={line.discountPercent.toString()}
                          value={lineCounters[line.id] ?? ""}
                          onChange={(e) =>
                            setLineCounters({
                              ...lineCounters,
                              [line.id]: e.target.value === "" ? "" : parseFloat(e.target.value),
                            })
                          }
                          className="w-14 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-1 text-center font-mono font-semibold text-xs focus:ring-1 focus:ring-neutral-400"
                        />
                        <span className="text-neutral-400 font-mono">%</span>
                      </div>
                    ) : (
                      <span className="font-mono text-neutral-400">—</span>
                    )}
                  </td>

                  {/* Line Comment Input */}
                  <td className="py-3.5 px-4">
                    {!isConfirmed ? (
                      <input
                        type="text"
                        placeholder="e.g. Can this be 15% off instead of 10%?"
                        value={lineComments[line.id] || ""}
                        onChange={(e) =>
                          setLineComments({
                            ...lineComments,
                            [line.id]: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 py-1 text-xs focus:ring-1 focus:ring-neutral-400"
                      />
                    ) : (
                      <span className="text-neutral-400 italic">Confirmed as final</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    ${line.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Delivery Date & Financial Summary */}
        <div className="p-4 bg-neutral-50/60 dark:bg-neutral-950/40 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <label className="font-medium text-neutral-700 dark:text-neutral-300">
              Requested Delivery Date:
            </label>
            <input
              type="date"
              disabled={isConfirmed}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase">Subtotal</span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                ${data.totalGross.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase">Discounts</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                -${data.totalDiscount.toFixed(2)}
              </span>
            </div>
            <div className="border-l border-neutral-200 dark:border-neutral-800 pl-4">
              <span className="text-[10px] text-neutral-400 block uppercase">Final Quote Total</span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                ${data.totalNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation History & Message Thread */}
      {data.comments.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> Negotiation History
          </h3>

          <div className="space-y-2.5">
            {data.comments.map((comm) => (
              <div
                key={comm.id}
                className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {comm.authorName}
                  </span>
                  <span className="text-[11px] font-mono">{comm.createdAt}</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {comm.commentText}
                </p>
                {comm.counterDiscountPercent !== null && comm.counterDiscountPercent !== undefined && (
                  <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Proposed Counter: {comm.counterDiscountPercent}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action CTAs */}
      {!isConfirmed && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="text-xs text-neutral-500">
            <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
              Ready to proceed?
            </span>
            Hit &quot;Confirm Quotation&quot; to finalize this order, or &quot;Submit Request&quot; to message your rep.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitRequest}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit Request
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmQuotation}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm Quotation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
