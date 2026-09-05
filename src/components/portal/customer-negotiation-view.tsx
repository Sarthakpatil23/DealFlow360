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
  ArrowLeft,
  Loader2,
  Truck,
  Package,
  ShieldAlert,
} from "lucide-react";
import { submitNegotiationRequestAction } from "@/app/actions/negotiation-actions";
import { confirmQuotationAction } from "@/app/actions/quotation-actions";
import {
  ActionFeedbackModal,
  FeedbackDetailItem,
  FeedbackType,
} from "@/components/ui/action-feedback-modal";

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

export interface PortalFulfillmentLine {
  warehouseName: string;
  units: number;
  isBackordered: boolean;
  shippedAt: string | null;
  status: string;
}

export interface PortalFulfillmentData {
  status: string;
  totalUnitsOrdered: number;
  totalUnitsShipped: number;
  deliveryStatus: "FULLY_DELIVERED" | "PARTIALLY_SHIPPED" | "IN_FULFILLMENT" | "PENDING";
  lines: PortalFulfillmentLine[];
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
  fulfillment?: PortalFulfillmentData | null;
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

  // Action Feedback Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    description: string;
    details?: FeedbackDetailItem[];
    primaryAction?: { label: string; onClick?: () => void; href?: string };
    secondaryAction?: { label: string; onClick?: () => void; href?: string };
  }>({
    isOpen: false,
    type: "success",
    title: "",
    description: "",
  });

  const isConfirmed = data.stage === "CONFIRMED";

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

        const count =
          res.details?.itemsCount ||
          payload.filter((p) => p.commentText || p.counterDiscountPercent !== undefined).length;

        setModalState({
          isOpen: true,
          type: "success",
          title: "Counter-Negotiation Request Submitted",
          description:
            res.message ||
            "Your counter-proposal has been transmitted directly to your assigned sales representative. They will review your requested terms and respond shortly.",
          details: [
            { label: "Quotation Code", value: data.displayCode },
            { label: "Organization", value: data.customerName },
            {
              label: "Proposals Submitted",
              value: `${count} item(s)`,
              badge: "In Review",
              badgeColor: "purple",
            },
            {
              label: "Deal Status",
              value: "Under Negotiation",
              badge: "Awaiting Rep",
              badgeColor: "blue",
            },
            ...(requestedDate
              ? [
                  {
                    label: "Requested Delivery",
                    value: new Date(requestedDate).toLocaleDateString(),
                  },
                ]
              : []),
          ],
          primaryAction: {
            label: "View Portal Proposals",
            href: "/portal",
          },
          secondaryAction: {
            label: "Continue Reviewing",
            onClick: () => {},
          },
        });

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

  // Handle Confirm Quotation
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
            text:
              res.message ||
              "Final agreed terms exceed discount thresholds and have automatically re-entered the approval flow.",
          });

          setModalState({
            isOpen: true,
            type: "warning",
            title: "Order Submitted for Manager Re-Approval",
            description:
              res.message ||
              "Final negotiated discounts exceed standard commercial delegation limits. Your order has been placed into the management approval queue.",
            details: [
              { label: "Quotation Code", value: data.displayCode },
              { label: "Customer", value: data.customerName },
              {
                label: "Approval Step",
                value: "Management Sign-off",
                badge: "Re-Approval Required",
                badgeColor: "amber",
              },
            ],
            primaryAction: {
              label: "Back to Dashboard",
              href: "/portal",
            },
          });
        } else {
          setData({ ...data, stage: "CONFIRMED" });
          setFeedback({
            type: "success",
            text:
              res.message ||
              "Quotation confirmed! Your order has been placed and sent to fulfillment.",
          });

          setModalState({
            isOpen: true,
            type: "success",
            title: "Quotation Confirmed — Order Placed!",
            description:
              res.message ||
              "Thank you for confirming! Your order has been officially recorded and dispatched to regional fulfillment warehouses.",
            details: [
              { label: "Quotation Code", value: data.displayCode },
              { label: "Customer", value: data.customerName },
              {
                label: "Fulfillment Status",
                value: "Scheduled for Shipment",
                badge: "Order Placed",
                badgeColor: "emerald",
              },
            ],
            primaryAction: {
              label: "View Order & Deliveries",
              href: "/portal",
            },
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

  const fulfillment = data.fulfillment;
  const fulfillmentPercent =
    fulfillment && fulfillment.totalUnitsOrdered > 0
      ? Math.round((fulfillment.totalUnitsShipped / fulfillment.totalUnitsOrdered) * 100)
      : isConfirmed
      ? 100
      : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Portal Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {data.stage === "CONFIRMED" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Order Confirmed
            </span>
          )}
          {data.stage === "NEGOTIATION" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              <MessageSquare className="w-3.5 h-3.5" /> Under Negotiation
            </span>
          )}
          {data.stage === "PENDING_APPROVAL" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" /> Re-approval In Progress
            </span>
          )}
          {data.stage === "APPROVED" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved — Ready to Confirm
            </span>
          )}
        </div>
      </div>

      {/* Screen Title & Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isConfirmed ? "Confirmed Order & Delivery Status" : "Quotation Proposal"} ({data.displayCode})
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isConfirmed
            ? "Your order has been officially confirmed and scheduled with regional distribution centers. Live delivery tracking and dispatch allocations are detailed below."
            : "Review your customized pricing proposal. You may suggest line-level counter discounts, leave notes for your rep, or accept terms to confirm this order."}
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : feedback.type === "info"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* DELIVERY & FULFILLMENT STATUS CARD (When Confirmed or has Fulfillment data) */}
      {isConfirmed && fulfillment && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Warehouse Fulfillment & Dispatch Status
              </h2>
              <p className="text-xs text-muted-foreground">
                Inventory allocation and delivery fulfillment from regional warehouses.
              </p>
            </div>

            <div>
              {fulfillment.deliveryStatus === "FULLY_DELIVERED" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fully Delivered
                </span>
              )}
              {fulfillment.deliveryStatus === "PARTIALLY_SHIPPED" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                  <Truck className="w-3.5 h-3.5" /> Partially Shipped / Dispatched
                </span>
              )}
              {fulfillment.deliveryStatus === "IN_FULFILLMENT" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" /> Allocating Warehouse Stock
                </span>
              )}
              {fulfillment.deliveryStatus === "PENDING" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                  <Clock className="w-3.5 h-3.5" /> Order Confirmed
                </span>
              )}
            </div>
          </div>

          {/* Fulfillment Progress & Warehouse Pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Metric progress */}
            <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Units Received / Shipped:</span>
                <span className="font-mono font-bold text-foreground">
                  {fulfillment.totalUnitsShipped} / {fulfillment.totalUnitsOrdered} units ({fulfillmentPercent}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, fulfillmentPercent)}%` }}
                />
              </div>
            </div>

            {/* Warehouse dispatches */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Regional Logistics Allocations:
              </span>
              <div className="flex flex-wrap gap-2">
                {fulfillment.lines.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    Allocating inventory from regional depots...
                  </span>
                ) : (
                  fulfillment.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground font-medium"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold">{line.warehouseName}:</span>
                      <span>{line.units} units</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          line.shippedAt
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : line.isBackordered
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {line.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto re-approval rule banner */}
      {!isConfirmed && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-950 dark:text-purple-200 space-y-0.5">
            <span className="font-bold block">Negotiation & Re-Approval Policy:</span>
            <p>
              When counter-discount requests exceed standard pricing tier limits, the proposal automatically re-enters an internal approval workflow before order confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Line-Level Comment & Counter Discount Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isConfirmed ? "Confirmed Order Line Items" : "Proposal Line Items & Counter-Discount"}
          </h2>
          <span className="text-xs font-mono font-semibold text-foreground">
            {data.orderLines.length} line item{data.orderLines.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Product Line</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Discount %</th>
                {!isConfirmed && <th className="py-3 px-4 text-center">Counter Discount %</th>}
                <th className="py-3 px-4">Customer Notes</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.orderLines.map((line) => (
                <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div>{line.productName}</div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">
                      {line.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-medium text-foreground">
                    {line.quantity}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    ${line.unitPrice.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                      {line.discountPercent}%
                    </span>
                  </td>

                  {/* Counter Discount % Input */}
                  {!isConfirmed && (
                    <td className="py-3.5 px-4 text-center">
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
                          className="w-14 rounded-lg border border-border bg-background p-1 text-center font-mono font-semibold text-xs focus:ring-1 focus:ring-foreground"
                        />
                        <span className="text-muted-foreground font-mono">%</span>
                      </div>
                    </td>
                  )}

                  {/* Line Comment Input */}
                  <td className="py-3.5 px-4">
                    {!isConfirmed ? (
                      <input
                        type="text"
                        placeholder="e.g. Requesting 15% discount for bulk volume"
                        value={lineComments[line.id] || ""}
                        onChange={(e) =>
                          setLineComments({
                            ...lineComments,
                            [line.id]: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:ring-1 focus:ring-foreground"
                      />
                    ) : (
                      <span className="text-muted-foreground italic">Confirmed in order</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                    ${line.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Delivery Date & Financial Summary */}
        <div className="p-4 bg-muted/20 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <label className="font-medium text-foreground">
              {isConfirmed ? "Delivery Scheduled:" : "Requested Delivery Date:"}
            </label>
            <input
              type="date"
              disabled={isConfirmed}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Subtotal</span>
              <span className="font-semibold text-foreground">
                ${data.totalGross.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Discounts</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                -${data.totalDiscount.toFixed(2)}
              </span>
            </div>
            <div className="border-l border-border pl-4">
              <span className="text-[10px] text-muted-foreground block uppercase">
                {isConfirmed ? "Total Order Value" : "Final Proposal Total"}
              </span>
              <span className="text-base font-bold text-foreground">
                ${data.totalNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation History & Message Thread */}
      {data.comments.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> Negotiation & Proposal History
          </h3>

          <div className="space-y-2.5">
            {data.comments.map((comm) => (
              <div
                key={comm.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/30 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {comm.authorName}
                  </span>
                  <span className="text-[11px] font-mono">{comm.createdAt}</span>
                </div>
                <p className="text-foreground">
                  {comm.commentText}
                </p>
                {comm.counterDiscountPercent !== null && comm.counterDiscountPercent !== undefined && (
                  <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground block">
              Accept Proposal or Counter?
            </span>
            Click &quot;Confirm Quotation&quot; to finalize this order, or &quot;Submit Counter Request&quot; to send line discount counter-proposals to your rep.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitRequest}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit Counter Request
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmQuotation}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm Quotation & Place Order
            </button>
          </div>
        </div>
      )}

      {/* Action Feedback Popup Modal */}
      <ActionFeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
        details={modalState.details}
        primaryAction={modalState.primaryAction}
        secondaryAction={modalState.secondaryAction}
      />
    </div>
  );
}
