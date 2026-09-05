"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from "lucide-react";

export function HeroInteractiveCard() {
  const [discount, setDiscount] = useState<number>(12);
  const [includeCarePlan, setIncludeCarePlan] = useState<boolean>(true);

  // Financial calculations
  const hardwareBase = 2400; // 2x Laptop Pro 14 @ $1200
  const servicesBase = 450; // Onsite Setup Service @ $450
  const subtotalBase = hardwareBase + servicesBase; // $2,850
  const discountAmount = Math.round((subtotalBase * discount) / 100);
  const discountedSubtotal = subtotalBase - discountAmount;
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
      className="relative w-full max-w-4xl mx-auto rounded-lg border border-[#ebebeb] bg-white/90 p-5 sm:p-7 shadow-floating backdrop-blur-md transition-all duration-300 hover:border-[#d1d1d1]"
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ebebeb] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#171717] text-white shadow-sm">
            <Sliders className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#8f8f8f]">
                Live Quote Simulator
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active CPQ Engine
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#171717] tracking-tight">
              Acme Corp <span className="text-[#8f8f8f] font-normal">• Q-1042</span>
            </h3>
          </div>
        </div>

        {/* Customer Tier Tag */}
        <div className="flex items-center gap-2">
          <div className="rounded-sm bg-[#fafafa] border border-[#ebebeb] px-2.5 py-1 text-xs font-mono text-[#4d4d4d]">
            Gold Account Tier (15% Cap)
          </div>
          <div className="hidden sm:flex rounded-sm bg-[#fafafa] border border-[#ebebeb] px-2.5 py-1 text-xs font-mono text-[#4d4d4d]">
            Rep: J. Rao
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Controls & Live Deal Intelligence */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-left">
        {/* Left Column: Line Items & Live Controls */}
        <div className="md:col-span-7 space-y-4">
          {/* Line items mini preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#8f8f8f] px-1">
              <span>Configured Line Items</span>
              <span>Category / Subtotal</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-sm bg-[#fafafa] border border-[#ebebeb] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#171717]" />
                  <span className="font-medium text-[#171717]">Laptop Pro 14</span>
                  <span className="text-[#8f8f8f] font-mono">Hardware (2x)</span>
                </div>
                <div className="font-mono text-[#171717] font-medium">$2,400</div>
              </div>

              <div className="flex items-center justify-between rounded-sm bg-[#fafafa] border border-[#ebebeb] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#8f8f8f]" />
                  <span className="font-medium text-[#171717]">Onsite Setup Service</span>
                  <span className="text-[#8f8f8f] font-mono">Services (1x)</span>
                </div>
                <div className="font-mono text-[#171717] font-medium">$450</div>
              </div>

              {/* Recurring Add-on toggle */}
              <div
                onClick={() => setIncludeCarePlan(!includeCarePlan)}
                className={`cursor-pointer flex items-center justify-between rounded-sm border p-2.5 text-xs transition-all duration-200 ${
                  includeCarePlan
                    ? "bg-[#fafafa] border-[#171717]"
                    : "bg-white border-dashed border-[#ebebeb] opacity-75"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeCarePlan}
                    onChange={(e) => setIncludeCarePlan(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-sm border-[#ebebeb] text-[#171717] focus:ring-0 cursor-pointer accent-[#171717]"
                  />
                  <span className="font-medium text-[#171717]">Care Plan 2-Year</span>
                  <span className="rounded-sm bg-white border border-[#ebebeb] px-1.5 py-0.5 text-[10px] font-mono text-[#4d4d4d]">
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
          <div className="rounded-sm bg-[#fafafa] border border-[#ebebeb] p-3.5 shadow-whisper">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="discount-range" className="text-xs font-medium text-[#171717]">
                Requested Deal Discount
              </label>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-sm font-semibold text-[#171717]">
                  {discount}%
                </span>
                <span className="text-xs text-[#8f8f8f]">
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
              className="w-full h-1.5 bg-[#ebebeb] rounded-sm appearance-none cursor-pointer accent-[#171717]"
            />

            <div className="mt-2 flex justify-between text-[11px] text-[#8f8f8f] font-mono">
              <span>0% Full Price</span>
              <span className="text-amber-700 font-medium">15% Gold Cap</span>
              <span>25% Exec Limit</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Deal Health & Governance Engine */}
        <div className="md:col-span-5 flex flex-col justify-between rounded-sm bg-[#171717] p-4 sm:p-5 text-white shadow-md space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
                DEAL HEALTH MATRIX
              </span>
              <div
                className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-mono font-semibold ${
                  isAutoApproved
                    ? "bg-emerald-900/50 text-emerald-300 border border-emerald-500/40"
                    : isManagerLevel
                    ? "bg-amber-900/50 text-amber-300 border border-amber-500/40"
                    : "bg-rose-900/50 text-rose-300 border border-rose-500/40"
                }`}
              >
                {isAutoApproved ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                <span>{healthScore}/100</span>
              </div>
            </div>

            {/* Live Governance Routing */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs font-mono text-[#a1a1a1]">Approval Workflow</div>
                <div className="text-sm font-medium tracking-tight text-white mt-0.5">
                  {isAutoApproved && "Fast-Track Auto Approved"}
                  {isManagerLevel && "Level 1: Sales Manager Review (M. Shah)"}
                  {isFinanceEscalation && "Level 2: Finance Executive Escalation (R. Iyer)"}
                </div>
              </div>

              {/* Dynamic Health Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-[#a1a1a1]">
                  <span>Gross Margin Health</span>
                  <span className="text-white font-medium">{marginPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
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
                <span className="text-xs font-mono text-[#a1a1a1]">Total Net Quotation</span>
                <div className="font-mono text-xl font-bold tracking-tight text-white">
                  ${discountedSubtotal.toLocaleString()}
                </div>
              </div>

              {includeCarePlan && (
                <div className="text-right">
                  <span className="text-xs font-mono text-[#a1a1a1]">Recurring</span>
                  <div className="font-mono text-xs font-medium text-emerald-400">
                    +$46/month
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#a1a1a1] pt-2 border-t border-white/5 font-mono">
              <span>Rule #402 Enforced</span>
              <span className="text-neutral-300 flex items-center gap-1">
                Details <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
