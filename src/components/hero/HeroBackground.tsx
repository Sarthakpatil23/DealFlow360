import React from "react";

export function HeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 3840 2160"
        className="h-full w-full object-cover"
      >
        <defs>
          <pattern
            id="hero-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <image href="/images/hero-grain.png" width="256" height="256" />
          </pattern>
        </defs>

        {/* High-resolution FeralUI gradient mesh texture */}
        <image
          id="Field"
          x="0"
          y="0"
          width="3840"
          height="2160"
          preserveAspectRatio="none"
          href="/images/hero-field.jpg"
        />

        {/* Film grain overlay */}
        <g opacity="0.05" style={{ mixBlendMode: "overlay" }}>
          <rect width="3840" height="2160" fill="url(#hero-grain-pattern)" />
        </g>
      </svg>

      {/* Subtle bottom gradient mask for seamless transition */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f2f2f0] via-[#f2f2f0]/60 to-transparent" />
    </div>
  );
}
