import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fafafa",
        foreground: "#171717",
        ink: "#171717",
        body: "#4d4d4d",
        mute: "#8f8f8f",
        faint: "#a1a1a1",
        hairline: {
          DEFAULT: "#ebebeb",
          soft: "#f2f2f2",
        },
        canvas: {
          DEFAULT: "#fafafa",
          elevated: "#ffffff",
        },
        primary: {
          DEFAULT: "#171717",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#ffffff",
          foreground: "#171717",
        },
        link: {
          DEFAULT: "#0070f3",
          deep: "#0761d1",
          soft: "#d3e5ff",
        },
        border: "#ebebeb",
        input: "#ebebeb",
        ring: "#171717",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
        "pill-category": "64px",
        pill: "100px",
        full: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "64px",
        "4xl": "96px",
        section: "128px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        "display-xl": "-2.4px",
        "heading-lg": "-1.28px",
        "heading-md": "-0.4px",
        "label-sm": "-0.28px",
      },
      boxShadow: {
        whisper: "0px 1px 1px rgba(0,0,0,0.04)",
        floating: "0px 2px 2px rgba(0,0,0,0.02), 0px 8px 16px -4px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
