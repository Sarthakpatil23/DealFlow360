"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { CustomerTier, ProductCategory } from "@prisma/client";
import { 
  calculateLineDiscountLimit, 
  DEFAULT_DISCOUNT_CEILINGS, 
  DiscountCeilingMap,
  LineDiscountLimitResult 
} from "@/lib/business-logic/discount-limits";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export interface DiscountLineItemProps {
  id: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  customerTier: CustomerTier;
  ceilings?: DiscountCeilingMap;
  defaultDiscountPercent?: number;
  onChange?: (data: {
    discountPercent: number;
    limitResult: LineDiscountLimitResult;
    lineTotal: number;
  }) => void;
  className?: string;
}

export function DiscountLineItem({
  id,
  productName,
  category,
  unitPrice,
  quantity,
  customerTier,
  ceilings = DEFAULT_DISCOUNT_CEILINGS,
  defaultDiscountPercent = 0,
  onChange,
  className,
}: DiscountLineItemProps) {
  const [discountInput, setDiscountInput] = useState<string>(String(defaultDiscountPercent));
  const numericDiscount = Number.isFinite(parseFloat(discountInput)) ? Math.max(0, parseFloat(discountInput)) : 0;

  const limitResult = calculateLineDiscountLimit({
    customerTier,
    productCategory: category,
    discountPercent: numericDiscount,
    ceilings,
  });

  const basePrice = unitPrice * quantity;
  const discountDeduction = basePrice * (numericDiscount / 100);
  const netTotal = Math.max(0, basePrice - discountDeduction);

  useEffect(() => {
    if (onChange) {
      onChange({
        discountPercent: numericDiscount,
        limitResult,
        lineTotal: netTotal,
      });
    }
  }, [numericDiscount, customerTier, category, ceilings]);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-200 bg-card text-card-foreground",
        limitResult.isOverLimit
          ? "border-red-500/40 bg-red-500/[0.02] shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]"
          : "border-border/60 hover:border-border",
        className
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Product & Category Info */}
        <div className="sm:col-span-4 space-y-0.5">
          <div className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
            <span>{productName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono uppercase text-[10px] px-1.5 py-0.2 rounded bg-muted">
              {category}
            </span>
            <span>•</span>
            <span>Qty: {quantity}</span>
            <span>•</span>
            <span>${unitPrice.toFixed(2)}/ea</span>
          </div>
        </div>

        {/* Live Discount Input */}
        <div className="sm:col-span-3">
          <label
            htmlFor={`discount-${id}`}
            className="block text-[11px] font-medium text-muted-foreground mb-1"
          >
            Discount % (Live check)
          </label>
          <div className="relative">
            <input
              id={`discount-${id}`}
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2",
                limitResult.isOverLimit
                  ? "border-red-500 text-red-600 focus:ring-red-500/20 bg-red-500/5"
                  : "border-input bg-background text-foreground focus:ring-ring"
              )}
            />
            <span className="absolute right-3 top-2 text-xs font-mono text-muted-foreground">
              %
            </span>
          </div>
        </div>

        {/* Effective Limit & Governance Rule */}
        <div className="sm:col-span-2 text-left sm:text-center space-y-0.5">
          <span className="block text-[11px] text-muted-foreground font-medium">
            Effective Limit
          </span>
          <div className="font-mono text-sm font-bold text-foreground">
            {limitResult.effectiveLimitPercent}%
          </div>
          <span className="block text-[10px] text-muted-foreground">
            {limitResult.stricterConstraint === "CATEGORY"
              ? "Category stricter"
              : limitResult.stricterConstraint === "TIER"
              ? "Tier stricter"
              : "Ceilings equal"}
          </span>
        </div>

        {/* Live Status Badge */}
        <div className="sm:col-span-3 flex flex-col items-start sm:items-end justify-center space-y-1">
          <span className="block text-[11px] text-muted-foreground font-medium">
            Line Status
          </span>
          {limitResult.isOverLimit ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              {limitResult.statusBadgeText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              OK
            </span>
          )}
          <span className="text-[11px] font-mono text-muted-foreground">
            Net: ${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Real-time Explainer Note on Overage */}
      {limitResult.isOverLimit && (
        <div className="mt-2.5 pt-2.5 border-t border-red-500/20 flex items-center justify-between text-[11px] text-red-600 dark:text-red-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
            Exceeds maximum ceiling by +{limitResult.overagePoints} points. Will trigger approval chain review upon submission.
          </span>
          <span className="font-mono text-[10px] text-red-500">
            Limit: {limitResult.effectiveLimitPercent}% | Given: {limitResult.discountPercent}%
          </span>
        </div>
      )}
    </div>
  );
}
