"use client";

import * as React from "react";
import { useState } from "react";
import { CustomerTier, ProductCategory } from "@prisma/client";
import { DiscountLineItem } from "@/components/quotations/discount-line-item";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck, Info } from "lucide-react";

interface QuotationLineState {
  id: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  defaultDiscount: number;
}

const CANONICAL_DEAL_LINES: QuotationLineState[] = [
  {
    id: "line-1",
    productName: "Laptop Pro 14",
    category: ProductCategory.HARDWARE,
    unitPrice: 1200.0,
    quantity: 2,
    defaultDiscount: 12.0,
  },
  {
    id: "line-2",
    productName: "Onsite Setup Service",
    category: ProductCategory.SERVICES,
    unitPrice: 450.0,
    quantity: 1,
    defaultDiscount: 18.0,
  },
  {
    id: "line-3",
    productName: "Extended Warranty",
    category: ProductCategory.SUBSCRIPTION,
    unitPrice: 180.0,
    quantity: 1,
    defaultDiscount: 10.0,
  },
];

export default function DiscountCheckTestPage() {
  const [tier, setTier] = useState<CustomerTier>(CustomerTier.GOLD);
  const [lineResults, setLineResults] = useState<Record<string, any>>({});

  function handleLineChange(id: string, data: any) {
    setLineResults((prev) => ({ ...prev, [id]: data }));
  }

  const resultsList = Object.values(lineResults);
  const overLinesCount = resultsList.filter((r) => r.limitResult?.isOverLimit).length;
  const maxOverage = resultsList.reduce(
    (max, r) => Math.max(max, r.limitResult?.overagePoints || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight">
              DealFlow360 — Step 14 Live Test Harness
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Title & Explanation */}
        <div className="space-y-1.5 border-b border-border pb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              Step 14 Verification
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Quotation: Q-1042 (Acme Corp)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Per-Line Discount Limit Governance
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            As soon as a sales rep enters a discount percentage on any line, the engine checks it live against the <strong>stricter of</strong> the customer tier ceiling and product category ceiling.
          </p>
        </div>

        {/* Customer Tier Control */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block">
              Customer Account Tier
            </label>
            <span className="text-xs text-muted-foreground">
              Changing tier re-evaluates all line ceilings in real time.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: "Bronze (5% max)", value: CustomerTier.BRONZE },
              { label: "Silver (10% max)", value: CustomerTier.SILVER },
              { label: "Gold (15% max)", value: CustomerTier.GOLD },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTier(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  tier === t.value
                    ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Line Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
            <span>Order Line Items (Deal Q-1042)</span>
            <span className="font-mono text-[11px]">Type in any discount % below</span>
          </div>

          {CANONICAL_DEAL_LINES.map((line) => (
            <DiscountLineItem
              key={line.id}
              id={line.id}
              productName={line.productName}
              category={line.category}
              unitPrice={line.unitPrice}
              quantity={line.quantity}
              customerTier={tier}
              defaultDiscountPercent={line.defaultDiscount}
              onChange={(data) => handleLineChange(line.id, data)}
            />
          ))}
        </div>

        {/* Live Governance Signals Summary Box */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Live Governance Analysis
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Evaluated on keystroke
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Customer Tier</span>
              <span className="font-bold text-sm text-foreground">{tier}</span>
              <span className="text-[10px] text-muted-foreground block">
                Ceiling: {tier === "GOLD" ? "15%" : tier === "SILVER" ? "10%" : "5%"}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Lines Over Limit</span>
              <span className={`font-bold text-sm ${overLinesCount > 0 ? "text-red-500" : "text-emerald-600"}`}>
                {overLinesCount} of {CANONICAL_DEAL_LINES.length} lines
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {overLinesCount > 0 ? "Requires approval" : "Within authorized limit"}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Worst Line Overage</span>
              <span className={`font-bold text-sm ${maxOverage > 0 ? "text-red-500" : "text-emerald-600"}`}>
                {maxOverage > 0 ? `+${maxOverage} points` : "0 points (Clean)"}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Feeds into Step 15 Blended Risk Score
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
