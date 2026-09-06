"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved theme - default to light
    const saved = localStorage.getItem("dealflow-theme") || localStorage.getItem("theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("dealflow-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="p-1.5 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070f3]"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-[#4d4d4d]" />
      )}
    </button>
  );
}
