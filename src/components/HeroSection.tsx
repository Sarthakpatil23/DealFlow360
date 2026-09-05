"use client";

import React, { useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, []);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-black selection:bg-white selection:text-black">
      {/* Full-screen Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/hero-vid.mp4" type="video/mp4" />
      </video>

      {/* Floating Resizable Navbar */}
      <Navbar />

      {/* Centered Hero: Name & Description strictly using DESIGN.md Geist Typography */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        {/* display-xl: Geist 600, -2.4px tracking */}
        <h1 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-2.4px] sm:tracking-[-3.2px] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)] leading-[1.0] max-w-4xl">
          DealFlow 360
        </h1>

        {/* body-lg: Geist 400, 16px-18px, 24px line-height */}
        <p className="mt-4 sm:mt-5 max-w-2xl font-sans text-base sm:text-lg font-normal text-white/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.7)] leading-relaxed tracking-normal">
          Configure complex multi-tier enterprise quotes in minutes. <br className="hidden sm:inline" />
          Automate approval workflows, sync live warehouse stock, and protect gross margins.
        </p>
      </div>
    </section>
  );
}
