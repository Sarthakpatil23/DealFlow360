"use client";

import React, { useRef, useState } from "react";
import { ArrowRight, Sparkles, Volume2, VolumeX } from "lucide-react";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden px-6 sm:px-10 lg:px-16 py-8 sm:py-10 selection:bg-[#171717] selection:text-white">
      {/* Full Background Video */}
      <video
        ref={videoRef}
        src="/hero-vid.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover -z-20"
      />

      {/* Subtle overlay to guarantee crisp typography contrast per DESIGN.md */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/70 backdrop-blur-[0.5px] -z-10"
        aria-hidden="true"
      />

      {/* Top Header / Brand Nav */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-white shadow-sm">
            <span className="font-mono text-xs font-bold tracking-tight">DF</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-[#171717]">
            Deal Flow
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#ebebeb] bg-white/80 backdrop-blur-md px-3 py-1 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-medium text-[#4d4d4d] uppercase tracking-wider">
              CPQ &amp; Sales Ops
            </span>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-[#ebebeb] bg-white/80 backdrop-blur-md text-[#171717] hover:bg-white transition-all shadow-sm"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-[#4d4d4d]" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-[#171717]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Hero Center Stage */}
      <div className="relative z-10 w-full max-w-4xl mx-auto my-auto py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Eyebrow Label (DESIGN.md: mono-eyebrow 12px, font-medium, uppercase) */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ebebeb] bg-white/80 backdrop-blur-md px-4 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Sparkles className="h-3 w-3 text-[#171717]" />
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">
            Enterprise Sales Operations
          </span>
        </div>

        {/* Product Title (DESIGN.md: display-xl tightly-tracked -2.4px, weight 600, ink #171717) */}
        <h1 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.045em] text-[#171717] leading-[0.98]">
          Deal Flow
        </h1>

        {/* Supporting Headline / Value Prop (DESIGN.md: body-lg 16px / 18px, color #4d4d4d) */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-[#4d4d4d] leading-relaxed font-normal">
          Next-generation CPQ, quotation lifecycle, margin protection, and multi-tier approval governance.
        </p>

        {/* Call To Action Buttons (DESIGN.md: rounded.pill 100px, primary #171717) */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href="#demo"
            className="group inline-flex items-center gap-2 rounded-full bg-[#171717] px-7 py-3.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-[#2c2c2c] hover:shadow-xl hover:scale-[1.01]"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          <a
            href="#specs"
            className="inline-flex items-center gap-2 rounded-full border border-[#ebebeb] bg-white/80 backdrop-blur-md px-7 py-3.5 text-sm font-medium text-[#171717] shadow-sm transition-all duration-200 hover:bg-white hover:border-[#d1d1d1]"
          >
            <span>View Architecture</span>
          </a>
        </div>
      </div>

      {/* Minimal Bottom Bar */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between pt-4 border-t border-black/10 text-xs font-mono text-[#4d4d4d]">
        <div className="flex items-center gap-2">
          <span>DEAL FLOW ENGINE</span>
          <span className="text-[#8f8f8f]">•</span>
          <span>v2.0</span>
        </div>
        <div>
          <span>BRANCH: HOME-PAGE</span>
        </div>
      </footer>
    </section>
  );
}
