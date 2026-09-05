"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Sparkles } from "lucide-react";

export function HeroNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 w-full pt-4 md:pt-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel flex h-14 items-center justify-between rounded-full px-5 py-2 transition-all duration-200">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-white shadow-sm">
              <span className="font-mono text-xs font-bold tracking-tighter">DF</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#171717]">
              DealFlow<span className="text-[#8E9094] font-normal">360</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#4d4d4d]">
              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
              v2.0 CPQ
            </span>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#4d4d4d]">
            <a
              href="#cpq-engine"
              className="transition-colors hover:text-[#171717]"
            >
              CPQ Engine
            </a>
            <a
              href="#deal-health"
              className="transition-colors hover:text-[#171717]"
            >
              Deal Health
            </a>
            <a
              href="#approvals"
              className="transition-colors hover:text-[#171717]"
            >
              Approval Chains
            </a>
            <a
              href="#margin-intel"
              className="transition-colors hover:text-[#171717]"
            >
              Margin Intelligence
            </a>
          </nav>

          {/* CTA Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-[13px] font-medium text-[#4d4d4d] hover:text-[#171717] transition-colors px-3 py-1.5">
              Sign In
            </button>
            <a
              href="#interactive-demo"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[#171717] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#2c2c2c] hover:shadow-md"
            >
              <span>Test Simulator</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md md:hidden text-[#171717]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="glass-panel mt-2 flex flex-col gap-3 rounded-2xl p-5 md:hidden border border-white/80 shadow-lg">
            <a
              href="#cpq-engine"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#4d4d4d] hover:text-[#171717]"
            >
              CPQ Engine
            </a>
            <a
              href="#deal-health"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#4d4d4d] hover:text-[#171717]"
            >
              Deal Health
            </a>
            <a
              href="#approvals"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#4d4d4d] hover:text-[#171717]"
            >
              Approval Chains
            </a>
            <a
              href="#margin-intel"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#4d4d4d] hover:text-[#171717]"
            >
              Margin Intelligence
            </a>
            <div className="pt-2 border-t border-black/5 flex flex-col gap-2">
              <button className="w-full text-left text-sm font-medium text-[#4d4d4d] py-1">
                Sign In
              </button>
              <a
                href="#interactive-demo"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#171717] px-4 py-2 text-xs font-medium text-white"
              >
                <span>Test Simulator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
