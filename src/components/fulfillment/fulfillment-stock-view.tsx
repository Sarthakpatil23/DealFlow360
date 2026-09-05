"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  StockTableItem,
  FulfillmentOrderItem,
  WarehouseOption,
  ProductOption,
} from "@/lib/fulfillment-data";
import { CreateWarehouseModal } from "./create-warehouse-modal";
import { SetStockModal } from "./set-stock-modal";
import { Plus, Warehouse, Boxes, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";

interface FulfillmentStockViewProps {
  initialStockItems: StockTableItem[];
  initialAwaitingOrders: FulfillmentOrderItem[];
  initialWarehouses: WarehouseOption[];
  initialProducts: ProductOption[];
}

export function FulfillmentStockView({
  initialStockItems,
  initialAwaitingOrders,
  initialWarehouses,
  initialProducts,
}: FulfillmentStockViewProps) {
  const router = useRouter();

  const [stockItems, setStockItems] = useState<StockTableItem[]>(initialStockItems);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>(initialWarehouses);
  const [products] = useState<ProductOption[]>(initialProducts);
  const [awaitingOrders] = useState<FulfillmentOrderItem[]>(initialAwaitingOrders);

  // Modal States
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Edit Stock State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedInStock, setSelectedInStock] = useState<number | undefined>(undefined);
  const [selectedReserved, setSelectedReserved] = useState<number | undefined>(undefined);

  // Success Feedback
  const [notification, setNotification] = useState<string | null>(null);

  const handleWarehouseCreated = (newWh: WarehouseOption) => {
    setWarehouses((prev) => [...prev, newWh]);
    setNotification(`Warehouse "${newWh.name}" created successfully.`);
    setTimeout(() => setNotification(null), 4000);
    router.refresh();
  };

  const handleStockSaved = (updatedStock: {
    warehouseId: string;
    productId: string;
    inStock: number;
    reserved: number;
    available: number;
  }) => {
    const wh = warehouses.find((w) => w.id === updatedStock.warehouseId);
    const prod = products.find((p) => p.id === updatedStock.productId);

    setStockItems((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.warehouseId === updatedStock.warehouseId && item.productId === updatedStock.productId
      );
      const updatedItem: StockTableItem = {
        id: idx >= 0 ? prev[idx].id : `temp-${Date.now()}`,
        warehouseId: updatedStock.warehouseId,
        warehouseName: wh?.name || "Warehouse",
        shippingCostWeight: wh?.shippingCostWeight || 1.0,
        productId: updatedStock.productId,
        productName: prod?.name || "Product",
        category: prod?.category || "HARDWARE",
        inStock: updatedStock.inStock,
        reserved: updatedStock.reserved,
        available: updatedStock.available,
      };

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedItem;
        return next;
      } else {
        return [...prev, updatedItem];
      }
    });

    setNotification(
      `Stock level saved for ${prod?.name || "Product"} in ${wh?.name || "Warehouse"}. Available: ${updatedStock.available}.`
    );
    setTimeout(() => setNotification(null), 4000);
    router.refresh();
  };

  const openAddStockFor = (warehouseId?: string, productId?: string, inStock?: number, reserved?: number) => {
    setSelectedWarehouseId(warehouseId);
    setSelectedProductId(productId);
    setSelectedInStock(inStock);
    setSelectedReserved(reserved);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-[#0d2818] p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 shadow-lg flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Action Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Fulfillment and Stock (List)
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
            Live stock per warehouse, plus every order that still needs fulfilling
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsWarehouseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#ededed] bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] hover:bg-neutral-50 dark:hover:bg-[#171717] rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#737373] dark:text-[#a1a1a1]" />
            <span>Add Warehouse</span>
          </button>
          <button
            onClick={() => openAddStockFor()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0070f3] hover:bg-[#0761d1] rounded-lg transition-colors shadow-xs"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Set / Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* 1. Main Stock Table matching Screen 7 */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold tracking-wider">
                <th className="px-6 py-3.5">Warehouse</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5 text-right">In Stock</th>
                <th className="px-6 py-3.5 text-right">Reserved</th>
                <th className="px-6 py-3.5 text-right">Available</th>
                <th className="px-6 py-3.5 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {stockItems.length > 0 ? (
                stockItems.map((item) => (
                  <tr
                    key={`${item.warehouseId}-${item.productId}`}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-[#171717] dark:text-[#ededed]">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-3.5 w-3.5 text-[#737373] dark:text-[#a1a1a1]" />
                        <span>{item.warehouseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#171717] dark:text-[#ededed]">
                      <span className="font-medium">{item.productName}</span>
                      <span className="ml-2 text-xs text-[#737373] dark:text-[#a1a1a1]">
                        ({item.category})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-[#171717] dark:text-[#ededed]">
                      {item.inStock}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {item.reserved > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          {item.reserved}
                        </span>
                      ) : (
                        <span className="text-xs text-[#737373] dark:text-[#a1a1a1]">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                          item.available > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            : item.available === 0
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        {item.available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          openAddStockFor(
                            item.warehouseId,
                            item.productId,
                            item.inStock,
                            item.reserved
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-[#0070f3] hover:underline inline-flex items-center gap-1"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-[#737373] dark:text-[#a1a1a1]"
                  >
                    No stock levels recorded yet. Click "Set / Adjust Stock" to initialize inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Orders Awaiting Fulfillment matching Screen 7 */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
          Orders Awaiting Fulfillment
        </h2>

        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold tracking-wider">
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Warehouses</th>
                  <th className="px-6 py-3.5 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
                {awaitingOrders.length > 0 ? (
                  awaitingOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/fulfillment/${order.id}`)}
                      className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-semibold text-[#0070f3] group-hover:underline">
                        {order.displayCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#171717] dark:text-[#ededed]">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                            order.status === "SPLIT_PENDING"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                              : order.status === "BACKORDER"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                          }`}
                        >
                          {order.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#737373] dark:text-[#a1a1a1]">
                        {order.warehouses}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-[#8f8f8f] group-hover:text-[#171717] dark:group-hover:text-white transition-colors ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-[#737373] dark:text-[#a1a1a1]"
                    >
                      No orders currently awaiting fulfillment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Wireframe Callout Banner matching screen7.png */}
      <div className="rounded-xl border border-amber-400/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-[#1a1506] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 shadow-2xs font-medium">
        Click an order row to open its warehouse split detail.
      </div>

      {/* Modals */}
      <CreateWarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        onWarehouseCreated={handleWarehouseCreated}
      />

      <SetStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        warehouses={warehouses}
        products={products}
        initialWarehouseId={selectedWarehouseId}
        initialProductId={selectedProductId}
        initialInStock={selectedInStock}
        initialReserved={selectedReserved}
        onStockSaved={handleStockSaved}
      />
    </div>
  );
}
