"use client";

import { useState, useEffect } from "react";
import { WarehouseOption, ProductOption } from "@/lib/fulfillment-data";
import { setStockLevelAction } from "@/app/actions/fulfillment-actions";
import { calculateAvailableStock } from "@/lib/business-logic/stock-calculation";
import { Boxes, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface SetStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: WarehouseOption[];
  products: ProductOption[];
  initialWarehouseId?: string;
  initialProductId?: string;
  initialInStock?: number;
  initialReserved?: number;
  onStockSaved: (stock: {
    warehouseId: string;
    productId: string;
    inStock: number;
    reserved: number;
    available: number;
  }) => void;
}

export function SetStockModal({
  isOpen,
  onClose,
  warehouses,
  products,
  initialWarehouseId,
  initialProductId,
  initialInStock,
  initialReserved,
  onStockSaved,
}: SetStockModalProps) {
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId || warehouses[0]?.id || "");
  const [productId, setProductId] = useState(initialProductId || products[0]?.id || "");
  const [inStock, setInStock] = useState(initialInStock?.toString() ?? "0");
  const [reserved, setReserved] = useState(initialReserved?.toString() ?? "0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialWarehouseId) setWarehouseId(initialWarehouseId);
    else if (warehouses.length > 0 && !warehouseId) setWarehouseId(warehouses[0].id);

    if (initialProductId) setProductId(initialProductId);
    else if (products.length > 0 && !productId) setProductId(products[0].id);

    if (initialInStock !== undefined) setInStock(initialInStock.toString());
    if (initialReserved !== undefined) setReserved(initialReserved.toString());
  }, [initialWarehouseId, initialProductId, initialInStock, initialReserved, warehouses, products]);

  if (!isOpen) return null;

  const parsedInStock = Math.max(0, parseInt(inStock, 10) || 0);
  const parsedReserved = Math.max(0, parseInt(reserved, 10) || 0);
  const computedAvailable = calculateAvailableStock(parsedInStock, parsedReserved);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!warehouseId) {
      setError("Please select a warehouse.");
      return;
    }
    if (!productId) {
      setError("Please select a product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setStockLevelAction({
        warehouseId,
        productId,
        inStock: parsedInStock,
        reserved: parsedReserved,
      });

      if (res.success && res.stockLevel) {
        onStockSaved({
          warehouseId,
          productId,
          inStock: res.stockLevel.inStock,
          reserved: res.stockLevel.reserved,
          available: res.stockLevel.available,
        });
        onClose();
      } else {
        setError(res.error || "Failed to update stock level.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-xl max-w-lg w-full overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb] dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
                Set Stock Level
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a1a1a1]">
                Configure warehouse inventory and reservation metrics
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="select-warehouse"
                className="block text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-1.5"
              >
                Warehouse
              </label>
              <select
                id="select-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (weight {w.shippingCostWeight})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="select-product"
                className="block text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-1.5"
              >
                Product
              </label>
              <select
                id="select-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                htmlFor="input-in-stock"
                className="block text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-1.5"
              >
                In Stock (Physical Count)
              </label>
              <input
                id="input-in-stock"
                type="number"
                min="0"
                step="1"
                value={inStock}
                onChange={(e) => setInStock(e.target.value)}
                required
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="input-reserved"
                className="block text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-1.5"
              >
                Reserved (Committed to Orders)
              </label>
              <input
                id="input-reserved"
                type="number"
                min="0"
                step="1"
                value={reserved}
                onChange={(e) => setReserved(e.target.value)}
                required
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors font-mono"
              />
            </div>
          </div>

          {/* Dynamic Available Calculation Panel */}
          <div className="rounded-lg border border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373] dark:text-[#a1a1a1] font-medium">
                Computed Available Stock:
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                  computedAvailable > 0
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                    : computedAvailable === 0
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                }`}
              >
                {computedAvailable} units available
              </span>
            </div>
            <p className="text-[11px] text-[#737373] dark:text-[#a1a1a1] font-mono">
              Formula: Available = In Stock ({parsedInStock}) - Reserved ({parsedReserved}) ={" "}
              {computedAvailable}
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
              <span>{isSubmitting ? "Saving..." : "Save Stock Level"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
