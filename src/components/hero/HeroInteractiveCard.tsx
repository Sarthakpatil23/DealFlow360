"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export function HeroInteractiveCard() {
  const [discount, setDiscount] = useState<number>(12);
  const [includeCarePlan, setIncludeCarePlan] = useState<boolean>(true);

  // Financial calculations based on project.md cast of characters
  const hardwareBase = 2400; // 2x Laptop Pro 14 @ $1200
  const servicesBase = 450; // Onsite Setup Service @ $450
  const subtotalBase = hardwareBase + servicesBase; // $2,850
  const discountAmount = Math.round((subtotalBase * discount) / 100);
  const discountedSubtotal = subtotalBase - discountAmount;
  const recurringMonthly = includeCarePlan ? 46 : 0;
  const cogs = 1050; // Cost of goods
  const grossProfit = discountedSubtotal - cogs;
  const marginPercent = ((grossProfit / discountedSubtotal) * 100).toFixed(1);

  // Approval rules (Acme Corp is Gold Tier: threshold 15%)
  const isAutoApproved = discount <= 15;
  const isManagerLevel = discount > 15 && discount <= 20;
  const isFinanceEscalation = discount > 20;

  const healthScore = isAutoApproved
    ? Math.max(88, Math.round(98 - discount * 0.7))
    : isManagerLevel
    ? Math.round(80 - (discount - 15) * 4)
    : Math.round(55 - (discount - 20) * 3.5);

  return (
    <div
      id="interactive-demo"
      className="glass-panel relative w-full max-w-4xl mx-auto rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl transition-all duration-300 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)]"
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-white shadow-sm">
            <Sliders className="h-5 w-5 text-[#f2f2f0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8E9094]">
                Live Quote Simulator
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Engine
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#171717] tracking-tight">
              Acme Corp <span className="text-[#8E9094] font-normal">• Q-1042</span>
            </h3>
          </div>
        </div>

        {/* Customer Tier Tag */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-800">
            Gold Account Tier (15% Cap)
          </div>
          <div className="hidden sm:flex rounded-lg bg-black/5 px-2.5 py-1 text-xs font-mono text-[#4d4d4d]">
            Rep: J. Rao
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Controls & Live Deal Intelligence */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Line Items & Live Controls */}
        <div className="md:col-span-7 space-y-5">
          {/* Line items mini preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#8E9094] px-1">
              <span>Configured Line Items</span>
              <span>Category / Qty</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-xl bg-white/70 border border-black/[0.04] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#171717]" />
                  <span className="font-medium text-[#171717]">Laptop Pro 14</span>
                  <span className="text-[#8E9094]">Hardware</span>
                </div>
                <div className="font-mono text-[#171717]">$2,400 (2x)</div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/70 border border-black/[0.04] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#8E9094]" />
                  <span className="font-medium text-[#171717]">Onsite Setup Service</span>
                  <span className="text-[#8E9094]">Services</span>
                </div>
                <div className="font-mono text-[#171717]">$450 (1x)</div>
              </div>

              {/* Recurring Add-on toggle */}
              <div
                onClick={() => setIncludeCarePlan(!includeCarePlan)}
                className={`cursor-pointer flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all duration-200 ${
                  includeCarePlan
                    ? "bg-black/[0.03] border-black/15 shadow-sm"
                    : "bg-white/40 border-dashed border-black/10 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeCarePlan}
                    onChange={(e) => setIncludeCarePlan(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-black/20 text-[#171717] focus:ring-0 cursor-pointer"
                  />
                  <span className="font-medium text-[#171717]">Care Plan 2-Year</span>
                  <span className="rounded bg-black/5 px-1.5 py-0.2 text-[10px] text-[#4d4d4d]">
                    Subscription
                  </span>
                </div>
                <div className="font-mono font-medium text-[#171717]">
                  +$46 / mo
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Discount Slider */}
          <div className="rounded-2xl bg-white/80 border border-black/[0.06] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="discount-range" className="text-xs font-semibold text-[#171717]">
                Requested Deal Discount
              </label>
              <div className="flex items-center gap-1">
                <span className="font-mono text-base font-bold text-[#171717]">
                  {discount}%
                </span>
                <span className="text-xs text-[#8E9094]">
                  (-${discountAmount.toLocaleString()})
                </span>
              </div>
            </div>

            <input
              id="discount-range"
              type="range"
              min="0"
              max="25"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full h-2 bg-[#DDDBE0] rounded-lg appearance-none cursor-pointer accent-[#171717]"
            />

            <div className="mt-2 flex justify-between text-[11px] text-[#8E9094] font-mono">
              <span>0% (Full Price)</span>
              <span className="text-amber-700 font-semibold">15% (Gold Threshold)</span>
              <span>25% (Exec Cap)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Deal Health & Governance Engine */}
        <div className="md:col-span-5 flex flex-col justify-between rounded-2xl bg-[#171717] p-5 text-white shadow-lg space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono tracking-wide text-neutral-400">
                DEAL HEALTH MATRIX
              </span>
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isAutoApproved
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : isManagerLevel
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {isAutoApproved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span>{healthScore}/100</span>
              </div>
            </div>

            {/* Live Governance Routing */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] text-neutral-400">Approval Workflow</div>
                <div className="text-sm font-semibold tracking-tight text-white mt-0.5">
                  {isAutoApproved && "Fast-Track Auto Approved"}
                  {isManagerLevel && "Level 1: Sales Manager Review (M. Shah)"}
                  {isFinanceEscalation && "Level 2: Finance Executive Escalation (R. Iyer)"}
                </div>
              </div>

              {/* Dynamic Health Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Gross Margin Health</span>
                  <span className="font-mono text-white font-medium">{marginPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAutoApproved
                        ? "bg-emerald-400"
                        : isManagerLevel
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, Number(marginPercent)))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary Bottom */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-neutral-400">Total Net Value</span>
                <div className="font-mono text-xl font-bold tracking-tight text-white">
                  ${discountedSubtotal.toLocaleString()}
                </div>
              </div>

              {includeCarePlan && (
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400">Recurring Cycle</span>
                  <div className="font-mono text-xs font-semibold text-emerald-400">
                    +$46/month
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/5">
              <span>Quotation Governance: Active</span>
              <span className="text-neutral-300 flex items-center gap-1 font-mono">
                CPQ Rule #402 <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
