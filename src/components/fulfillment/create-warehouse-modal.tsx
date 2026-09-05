"use client";

import { useState } from "react";
import { WarehouseOption } from "@/lib/fulfillment-data";
import { createWarehouseAction } from "@/app/actions/fulfillment-actions";
import { Warehouse, X, AlertCircle } from "lucide-react";

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWarehouseCreated: (warehouse: WarehouseOption) => void;
}

export function CreateWarehouseModal({
  isOpen,
  onClose,
  onWarehouseCreated,
}: CreateWarehouseModalProps) {
  const [name, setName] = useState("");
  const [shippingCostWeight, setShippingCostWeight] = useState("1.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Warehouse name is required.");
      return;
    }

    const weight = parseFloat(shippingCostWeight);
    if (isNaN(weight) || weight <= 0) {
      setError("Shipping cost weight must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createWarehouseAction({
        name: trimmed,
        shippingCostWeight: weight,
      });

      if (res.success && res.warehouse) {
        onWarehouseCreated(res.warehouse);
        setName("");
        setShippingCostWeight("1.0");
        onClose();
      } else {
        setError(res.error || "Failed to create warehouse.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-xl max-w-md w-full overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
                Add Warehouse
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a1a1a1]">
                Define a physical inventory location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:text-[#a1a1a1] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#171717] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-[#1f0b0e] text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="warehouse-name"
              className="block text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-1.5"
            >
              Warehouse Name
            </label>
            <input
              id="warehouse-name"
              type="text"
              placeholder="e.g. West Coast Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] placeholder:text-[#8f8f8f] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="shipping-weight"
                className="block text-xs font-semibold text-[#171717] dark:text-[#ededed]"
              >
                Shipping Cost Weight
              </label>
              <span className="text-[11px] text-[#737373] dark:text-[#a1a1a1]">
                Default: 1.0 (Lower = Preferred)
              </span>
            </div>
            <input
              id="shipping-weight"
              type="number"
              step="0.1"
              min="0.1"
              max="10.0"
              value={shippingCostWeight}
              onChange={(e) => setShippingCostWeight(e.target.value)}
              required
              className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
            />
            <p className="text-[11px] text-[#737373] dark:text-[#a1a1a1] mt-1">
              Used by the automated split algorithm to prioritize cheaper fulfillment locations.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#ebebeb] dark:border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717] dark:text-[#a1a1a1] dark:hover:text-white rounded-lg border border-[#ebebeb] dark:border-[#262626] hover:bg-neutral-50 dark:hover:bg-[#171717] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-[#0070f3] hover:bg-[#0761d1] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              <span>{isSubmitting ? "Creating..." : "Create Warehouse"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
