"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, TrendingUp, Layers } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { HeroNavbar } from "./HeroNavbar";
import { HeroInteractiveCard } from "./HeroInteractiveCard";

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between">
      {/* Background with FeralUI Mesh Gradient + Film Grain */}
      <HeroBackground />

      {/* Floating Top Navigation */}
      <HeroNavbar />

      {/* Hero Body Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-18 pb-16">
        {/* Eyebrow Badge */}
        <div className="flex justify-center">
          <div className="glass-panel inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium text-[#171717] shadow-sm transition-all duration-300 hover:scale-[1.02]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">DealFlow 2.0</span>
            <span className="text-[#8E9094]">•</span>
            <span className="text-[#4d4d4d]">Next-Gen B2B CPQ & Margin Protection</span>
            <ArrowRight className="h-3 w-3 text-[#8E9094]" />
          </div>
        </div>

        {/* Hero Editorial Display Headline */}
        <div className="mt-8 text-center max-w-4xl mx-auto space-y-4">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#171717] font-normal leading-[0.96]">
            Deal velocity meets <br />
            <span className="italic font-normal text-[#2A2622]">zero margin leakage.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#4d4d4d] leading-relaxed font-sans pt-2">
            Configure complex enterprise quotes in minutes. Enforce customer-tier discount
            guardrails, automate multi-level approval workflows, and protect gross margins in real time.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#interactive-demo"
              className="group inline-flex items-center gap-2 rounded-full bg-[#171717] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-[#2c2c2c] hover:shadow-xl hover:scale-[1.01]"
            >
              <span>Test Interactive CPQ</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>

            <a
              href="#platform-specs"
              className="glass-panel inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-[#171717] transition-all duration-200 hover:bg-white/90 shadow-sm"
            >
              <span>Platform Specs</span>
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[11px] font-mono text-[#4d4d4d]">
                18 Workflows
              </span>
            </a>
          </div>

          {/* Metric Highlights Pill Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#4d4d4d]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#171717]">3.8x</span>
              <span>Faster Quote Turnaround</span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#171717]">100%</span>
              <span>Approval Audit Trail</span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#171717]">0%</span>
              <span>Rogue Margin Leakage</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Deal Simulator Widget */}
        <div className="mt-12 sm:mt-16">
          <HeroInteractiveCard />
        </div>

        {/* Social Proof / Enterprise Customers strip */}
        <div id="platform-specs" className="mt-14 text-center">
          <p className="text-xs uppercase tracking-widest font-mono text-[#8E9094] mb-4">
            Engineered for high-volume B2B Sales Operations &amp; Finance Teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-serif text-lg tracking-wide text-[#171717] font-semibold">ACME CORP</span>
            <span className="font-sans text-sm tracking-widest font-bold text-[#171717]">ZENITH CO</span>
            <span className="font-mono text-sm tracking-tight font-medium text-[#171717]">NOVA RETAIL</span>
            <span className="font-serif text-lg tracking-wider italic text-[#171717]">Orion Ltd</span>
            <span className="font-sans text-xs tracking-widest uppercase font-semibold text-[#171717]">DELTA ENTERPRISES</span>
          </div>
        </div>
      </div>

      {/* Subtle bottom border delimiter */}
      <div className="relative z-10 w-full border-t border-black/[0.05] py-4 text-center text-xs text-[#8E9094] font-mono">
        DealFlow360 • Branch: home-page • Isolated Preview
      </div>
    </section>
  );
}
