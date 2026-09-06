"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FulfillmentDetailData,
  FulfillmentDetailAllocation,
} from "@/lib/fulfillment-data";
import {
  acceptSuggestedSplitAction,
  manualOverrideSplitAction,
  consolidateBackorderAction,
} from "@/app/actions/fulfillment-actions";
import {
  ArrowLeft,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Truck,
  Layers,
  Building2,
  Package,
  Loader2,
} from "lucide-react";

interface FulfillmentDetailViewProps {
  initialData: FulfillmentDetailData;
}

export function FulfillmentDetailView({ initialData }: FulfillmentDetailViewProps) {
  const router = useRouter();
  const [data, setData] = useState<FulfillmentDetailData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Editable allocations for Manual Override
  const [manualAllocations, setManualAllocations] = useState<
    { warehouseId: string; warehouseName: string; quantity: number }[]
  >(() =>
    data.warehouses.map((w) => {
      const current = data.allocations.find((a) => a.warehouseId === w.id);
      return {
        warehouseId: w.id,
        warehouseName: w.name,
        quantity: current?.quantityFulfilled || 0,
      };
    })
  );

  // Calculate sum in edit mode to show if under/over
  const manualTotal = manualAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const remainingDifference = data.totalQuantity - manualTotal;

  /**
   * 1. Accept Suggested Split
   */
  async function handleAcceptSuggestedSplit() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await acceptSuggestedSplitAction(
        data.fulfillmentId,
        data.suggestedAllocations.map((a) => ({
          warehouseId: a.warehouseId,
          quantityFulfilled: a.quantityFulfilled,
          estimatedCost: a.estimatedCost,
          isBackordered: a.isBackordered,
        }))
      );

      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Suggested split accepted!" });
        setData((prev) => ({
          ...prev,
          allocations: prev.suggestedAllocations,
          status: prev.suggestedAllocations.some((a) => a.isBackordered)
            ? "BACKORDER"
            : prev.suggestedAllocations.length > 1
            ? "SPLIT_PENDING"
            : "FULFILLED",
          statusLabel: prev.suggestedAllocations.some((a) => a.isBackordered)
            ? "Backorder"
            : prev.suggestedAllocations.length > 1
            ? "Split Pending"
            : "Fulfilled",
        }));
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to accept split." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  /**
   * 2. Save Manual Override
   */
  async function handleSaveManualOverride() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const payload = manualAllocations
        .filter((m) => m.quantity > 0)
        .map((m) => ({
          warehouseId: m.warehouseId,
          quantityFulfilled: m.quantity,
          isBackordered: false,
        }));

      // If manual total is less than needed, add remainder as backorder
      if (remainingDifference > 0) {
        payload.push({
          warehouseId: data.warehouses[0]?.id || "unassigned",
          quantityFulfilled: remainingDifference,
          isBackordered: true,
        });
      }

      const res = await manualOverrideSplitAction(data.fulfillmentId, payload);

      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Manual override saved!" });
        setIsEditing(false);
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to save manual override." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  /**
   * 3. Consolidate Remaining Backorder
   */
  async function handleConsolidateBackorder() {
    if (data.warehouses.length === 0) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await consolidateBackorderAction(
        data.fulfillmentId,
        data.warehouses[0].id
      );

      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Backorders consolidated!" });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to consolidate." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-[#737373] dark:text-[#a1a1a1]">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/fulfillment" className="hover:underline">
              Fulfillment
            </Link>
            <span>/</span>
            <span className="font-mono text-[#171717] dark:text-[#ededed] font-medium">
              {data.displayCode}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
              Fulfillment Detail ({data.displayCode})
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                data.status === "SPLIT_PENDING"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                  : data.status === "BACKORDER"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              }`}
            >
              {data.statusLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
            Customer: <strong className="text-[#171717] dark:text-[#ededed] font-semibold">{data.customerName}</strong> &bull; Item: <span className="font-medium text-[#171717] dark:text-[#ededed]">{data.productName}</span> ({data.totalQuantity} units requested)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/fulfillment"
            className="inline-flex items-center gap-1.5 border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Stock & Orders
          </Link>
        </div>
      </div>

      {/* Status / Feedback Banner */}
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

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-[#a1a1a1] block mb-1">Total Requested Units</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#171717] dark:text-[#ededed] font-mono">
              {data.totalQuantity}
            </span>
            <span className="text-xs text-[#737373] dark:text-[#a1a1a1]">units</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-[#a1a1a1] block mb-1">Allocated Across Warehouses</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {data.allocations.filter((a) => !a.isBackordered).reduce((s, a) => s + a.quantityFulfilled, 0)}
            </span>
            <span className="text-xs text-[#737373] dark:text-[#a1a1a1]">units allocated</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-[#a1a1a1] block mb-1">Backordered Remainder</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                data.hasBackorder
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-[#737373] dark:text-[#a1a1a1]"
              }`}
            >
              {data.allocations.filter((a) => a.isBackordered).reduce((s, a) => s + a.quantityFulfilled, 0)}
            </span>
            <span className="text-xs text-[#737373] dark:text-[#a1a1a1]">units awaiting restock</span>
          </div>
        </div>
      </div>

      {/* Main Fulfillment Allocation Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] dark:border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fcfcfc] dark:bg-[#0d0d0d]">
          <div>
            <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
              Warehouse Fulfillment Split
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
              {isEditing
                ? "Manually adjust units fulfilled per warehouse."
                : "Optimal inventory pull computed by lowest shipping weight."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#ebebeb] dark:border-[#262626] hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualOverride}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0070f3] text-white hover:bg-[#0761d1] transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save Custom Split
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <Sliders className="h-3.5 w-3.5 text-[#737373]" />
                  Manual Override
                </button>

                <button
                  type="button"
                  onClick={handleAcceptSuggestedSplit}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:bg-black dark:hover:bg-neutral-100 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Accept Suggested Split
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Mode Notice */}
        {isEditing && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/40 p-3 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
            <span>
              Total needed: <strong>{data.totalQuantity}</strong> | Currently entered: <strong>{manualTotal}</strong>
              {remainingDifference > 0 && ` (${remainingDifference} will remain Backordered)`}
              {remainingDifference < 0 && ` (Warning: exceeding needed by ${Math.abs(remainingDifference)})`}
            </span>
            <span className="text-[11px] font-mono">Manual Allocation Mode</span>
          </div>
        )}

        {/* Split Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] font-semibold">
                <th className="px-6 py-3">Warehouse</th>
                <th className="px-6 py-3">Qty Fulfilled</th>
                <th className="px-6 py-3">Est. Shipments</th>
                <th className="px-6 py-3">Est. Cost</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {isEditing ? (
                // MANUAL OVERRIDE ROWS
                manualAllocations.map((alloc, idx) => (
                  <tr key={alloc.warehouseId} className="hover:bg-neutral-50/50 dark:hover:bg-[#141414]">
                    <td className="px-6 py-3.5 font-medium flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-[#737373]" />
                      {alloc.warehouseName}
                    </td>
                    <td className="px-6 py-3.5">
                      <input
                        type="number"
                        min="0"
                        max={data.totalQuantity}
                        value={alloc.quantity}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setManualAllocations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                          );
                        }}
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-input bg-background font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[#737373]">1</td>
                    <td className="px-6 py-3.5 font-mono text-[#737373]">Calculated on save</td>
                    <td className="px-6 py-3.5 text-right font-medium text-blue-600">Manual Edit</td>
                  </tr>
                ))
              ) : (
                // NORMAL VIEW ROWS
                data.allocations.map((line, idx) => (
                  <tr
                    key={line.id || idx}
                    className={`hover:bg-neutral-50/50 dark:hover:bg-[#141414] transition-colors ${
                      line.isBackordered ? "bg-rose-50/30 dark:bg-rose-950/10" : ""
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium flex items-center gap-2">
                      {line.isBackordered ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5 text-[#737373] flex-shrink-0" />
                      )}
                      <span>{line.warehouseName}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-sm">
                      {line.quantityFulfilled} units
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[#737373] dark:text-[#a1a1a1]">
                      {line.estimatedShipments}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-medium">
                      {line.isBackordered ? "—" : `$${line.estimatedCost.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {line.isBackordered ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                          Backordered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                          Fulfilled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wireframe Specific Callout: Consolidate Remaining Backorder Banner */}
      <div className="rounded-xl border border-amber-400/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-[#1a1506] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold block">Automatic Backorder Consolidation Prompt:</span>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              &quot;Consolidate Remaining Backorder&quot; prompt appears automatically once East Depot or another warehouse restocks.
            </p>
          </div>
        </div>

        {data.canConsolidateBackorder && (
          <button
            type="button"
            onClick={handleConsolidateBackorder}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex-shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Consolidate Backorders Now
          </button>
        )}
      </div>
    </div>
  );
}
