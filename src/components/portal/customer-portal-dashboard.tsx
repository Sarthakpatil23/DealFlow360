"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  Calendar,
  Building,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CustomerPortalNav } from "./customer-portal-nav";

export interface CustomerOrderLineInfo {
  id: string;
  productName: string;
  category: string;
  quantityOrdered: number;
  quantityShipped: number;
  quantityBackordered: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  shipmentStatus: "DELIVERED" | "SHIPPED" | "PROCESSING" | "BACKORDER";
  warehouseName?: string;
  shippedAt?: string | null;
}

export interface CustomerOrderInfo {
  id: string;
  displayCode: string;
  stage: string;
  createdAt: string;
  totalValue: number;
  totalUnitsOrdered: number;
  totalUnitsShipped: number;
  deliveryStatus: "FULLY_DELIVERED" | "PARTIALLY_SHIPPED" | "IN_FULFILLMENT" | "PENDING";
  lines: CustomerOrderLineInfo[];
  shipments: {
    warehouseName: string;
    units: number;
    isBackordered: boolean;
    shippedAt: string | null;
    status: string;
  }[];
  invoices: {
    displayCode: string;
    type: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
}

export interface CustomerQuoteInfo {
  id: string;
  displayCode: string;
  stage: string;
  createdAt: string;
  totalValue: number;
  itemCount: number;
  lines: {
    productName: string;
    quantity: number;
    discountPercent: number;
    lineTotal: number;
  }[];
}

export interface CustomerInvoiceInfo {
  id: string;
  displayCode: string;
  type: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  quotationCode?: string;
}

export interface CustomerSubscriptionInfo {
  id: string;
  planName: string;
  cycle: string;
  pricePerCycle: number;
  nextBillDate: string | null;
  status: string;
}

export interface CustomerCreditNoteInfo {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface CustomerPortalDashboardProps {
  customer: {
    id: string;
    name: string;
    tier: string;
    currency: string;
    userEmail: string;
  };
  orders: CustomerOrderInfo[];
  proposals: CustomerQuoteInfo[];
  invoices: CustomerInvoiceInfo[];
  subscriptions: CustomerSubscriptionInfo[];
  creditNotes: CustomerCreditNoteInfo[];
}

export function CustomerPortalDashboard({
  customer,
  orders,
  proposals,
  invoices,
  subscriptions,
  creditNotes,
}: CustomerPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "quotes" | "billing">("orders");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Summary Metrics
  const totalUnitsOrdered = orders.reduce((sum, o) => sum + o.totalUnitsOrdered, 0);
  const totalUnitsShipped = orders.reduce((sum, o) => sum + o.totalUnitsShipped, 0);
  const fulfillmentPercentage =
    totalUnitsOrdered > 0 ? Math.round((totalUnitsShipped / totalUnitsOrdered) * 100) : 100;

  const unpaidInvoices = invoices.filter((i) => i.status === "UNPAID");
  const unpaidBalance = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

  function toggleExpandOrder(id: string) {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-foreground flex flex-col font-sans transition-colors duration-150">
      {/* Clean Customer-Only Navigation Header (NO internal staff links!) */}
      <CustomerPortalNav
        customerName={customer.name}
        customerTier={customer.tier}
        userEmail={customer.userEmail}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Account Banner */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {customer.name}
                </h1>
                <span className="uppercase text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {customer.tier} TIER
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Track your active orders, warehouse shipments, unit fulfillment, proposals, and invoices in real-time.
              </p>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg ${
                  activeTab === "orders" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("quotes")}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg ${
                  activeTab === "quotes" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Proposals ({proposals.length})
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg ${
                  activeTab === "billing" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Billing
              </button>
            </div>
          </div>

          {/* 4 HIGH-LEVEL METRIC TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/80">
            {/* Tile 1: Confirmed Orders */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">Active Orders</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground">{orders.length}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Confirmed Deals
                </span>
              </div>
            </div>

            {/* Tile 2: Fulfillment & Received Progress */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                Units Fulfilled / Received
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground">
                  {totalUnitsShipped} / {totalUnitsOrdered}
                </span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {fulfillmentPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, fulfillmentPercentage)}%` }}
                />
              </div>
            </div>

            {/* Tile 3: Active Proposals */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">Proposals to Review</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground">{proposals.length}</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  Under Review
                </span>
              </div>
            </div>

            {/* Tile 4: Unpaid Balance */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">Open Invoiced Balance</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground">
                  ${unpaidBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {unpaidInvoices.length} Unpaid
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: ORDERS & DELIVERIES (HOW MANY RECEIVED, STATUS, WAREHOUSE TRACKING) */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Your Orders, Shipments & Delivery Status
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time status of items ordered, units dispatched from regional warehouses, and received inventory.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {orders.length} active order{orders.length === 1 ? "" : "s"}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-sm font-semibold text-foreground">No Confirmed Orders Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When you review and confirm a quotation proposal, it will appear here with live warehouse shipment and tracking updates.
                </p>
                <button
                  onClick={() => setActiveTab("quotes")}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  View Open Proposals <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrders[order.id] !== false; // Default expanded

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-0"
                  >
                    {/* Order Card Header */}
                    <div className="p-5 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-base font-bold text-foreground">
                            Order {order.displayCode}
                          </span>

                          {order.deliveryStatus === "FULLY_DELIVERED" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Delivered
                            </span>
                          )}
                          {order.deliveryStatus === "PARTIALLY_SHIPPED" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                              <Truck className="w-3.5 h-3.5" /> Partially Shipped / Dispatched
                            </span>
                          )}
                          {order.deliveryStatus === "IN_FULFILLMENT" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" /> Allocating Warehouse Stock
                            </span>
                          )}
                          {order.deliveryStatus === "PENDING" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              <Clock className="w-3.5 h-3.5" /> Order Confirmed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Placed: {order.createdAt}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-foreground">
                            ${order.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-foreground">
                            {order.totalUnitsShipped} of {order.totalUnitsOrdered} units received
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/portal/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                        >
                          View Full Details <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </Link>

                        <button
                          onClick={() => toggleExpandOrder(order.id)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title={isExpanded ? "Collapse item list" : "Expand item list"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Regional Warehouse Dispatch Pills */}
                    {order.shipments.length > 0 && (
                      <div className="px-5 py-3 bg-muted/40 border-b border-border/80 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Dispatched Via:
                        </span>
                        {order.shipments.map((ship, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card text-foreground font-medium shadow-2xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold">{ship.warehouseName}:</span>
                            <span>{ship.units} units</span>
                            {ship.shippedAt ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                                (Shipped)
                              </span>
                            ) : ship.isBackordered ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">
                                (Backorder)
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                (Processing)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded Items & Tracking Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                            <tr>
                              <th className="py-3 px-5">Item / Product</th>
                              <th className="py-3 px-4 text-center">Qty Ordered</th>
                              <th className="py-3 px-4 text-center">Units Received / Shipped</th>
                              <th className="py-3 px-4">Warehouse Source</th>
                              <th className="py-3 px-4">Delivery Status</th>
                              <th className="py-3 px-5 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {order.lines.map((line) => (
                              <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-5">
                                  <div className="font-semibold text-foreground">
                                    {line.productName}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                    {line.category}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-center font-mono font-medium text-foreground">
                                  {line.quantityOrdered}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="font-mono font-bold text-foreground">
                                    {line.quantityShipped}
                                  </span>
                                  <span className="text-muted-foreground text-[11px] ml-1">
                                    / {line.quantityOrdered}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-muted-foreground">
                                  {line.warehouseName || "Regional Logistics Center"}
                                </td>

                                <td className="py-3 px-4">
                                  {line.shipmentStatus === "DELIVERED" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Received
                                    </span>
                                  )}
                                  {line.shipmentStatus === "SHIPPED" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                      <Truck className="w-3.5 h-3.5" /> In Transit
                                    </span>
                                  )}
                                  {line.shipmentStatus === "BACKORDER" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Backordered
                                    </span>
                                  )}
                                  {line.shipmentStatus === "PROCESSING" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Clock className="w-3.5 h-3.5" /> Processing
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-5 text-right font-mono font-bold text-foreground">
                                  ${line.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: QUOTATIONS & PROPOSALS (SCREEN 11 NEGOTIATION WORKSPACE) */}
        {activeTab === "quotes" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Your Active Quotations & Proposals
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review customized pricing proposals, propose counter-discounts, and confirm agreements.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {proposals.length} proposal{proposals.length === 1 ? "" : "s"}
              </span>
            </div>

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-sm font-semibold text-foreground">No Open Proposals Pending Review</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All active proposals have been confirmed into real orders. When your rep issues a new deal draft, it will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposals.map((quote) => (
                  <div
                    key={quote.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 hover:border-border transition-all shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-foreground">
                        {quote.displayCode}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                        {quote.stage.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Items on Proposal:</span>
                        <span className="font-medium text-foreground">{quote.itemCount} line items</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Issued Date:</span>
                        <span className="font-medium text-foreground">{quote.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="font-semibold text-foreground">Total Proposal Value:</span>
                        <span className="font-mono text-base font-bold text-foreground">
                          ${quote.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/portal/${quote.id}`}
                      className="block w-full text-center py-2.5 px-4 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
                    >
                      Open Proposal & Negotiate →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BILLING, INVOICES & SUBSCRIPTIONS */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Invoices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Invoices & Payment Records
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    One-time delivery charges and recurring billing invoices.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground font-semibold">
                  {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Billing Type</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No invoices issued yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                            {inv.displayCode}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {inv.type.replace("_", "-")}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {inv.dueDate}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                            ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {inv.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Paid {inv.paidAt ? `(${inv.paidAt})` : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" /> Due for Payment
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

            {/* Recurring Subscriptions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Active Recurring Subscriptions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ongoing software, enterprise support plans, and cloud services.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground font-semibold">
                  {subscriptions.length} plan{subscriptions.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Billing Cycle</th>
                      <th className="py-3 px-4">Next Renewal Date</th>
                      <th className="py-3 px-4 text-right">Cycle Rate</th>
                      <th className="py-3 px-4 text-right">Plan Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No active subscriptions.
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {sub.planName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {sub.cycle.charAt(0) + sub.cycle.slice(1).toLowerCase()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {sub.status === "PAUSED" ? "— (Paused)" : sub.nextBillDate || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                            ${sub.pricePerCycle.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded border border-border bg-muted text-foreground">
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit Notes (if any) */}
            {creditNotes.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Refunds & Credit Notes
                </h3>
                <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-3 px-4">Credit ID</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Issued</th>
                        <th className="py-3 px-4 text-right">Credit Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {creditNotes.map((cn) => (
                        <tr key={cn.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-muted-foreground truncate max-w-[120px]">
                            {cn.id}
                          </td>
                          <td className="py-3.5 px-4 text-foreground">
                            {cn.reason}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {cn.createdAt}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${cn.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
