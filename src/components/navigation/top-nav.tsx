"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Quotations", href: "/quotations" },
  { label: "Approvals", href: "/approvals" },
  { label: "Fulfillment", href: "/fulfillment" },
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Invoices", href: "/invoices" },
  { label: "Deal Health", href: "/deal-health" },
  { label: "Reports", href: "/reports" },
  { label: "Products", href: "/products" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40 transition-colors duration-150 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <div className="h-6 w-6 rounded bg-[#171717] dark:bg-[#ffffff] transition-transform group-hover:scale-105" />
            <span className="font-semibold text-base tracking-tight text-[#171717] dark:text-[#ededed]">
              DealFlow360
            </span>
          </Link>
        </div>

        {/* Navigation Items & Theme Toggle */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-full">
          <nav
            className="flex items-center gap-1.5"
            aria-label="Internal Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard" && pathname === "/") ||
                (item.href === "/products" && (pathname === "/product" || pathname.startsWith("/products"))) ||
                (item.href !== "/dashboard" && item.href !== "/products" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm px-3.5 py-1.5 rounded-md transition-all duration-150 whitespace-nowrap font-medium ${
                    isActive
                      ? "bg-[#171717] text-white border border-[#171717] dark:bg-[#ededed] dark:text-[#171717] dark:border-[#ededed] shadow-xs"
                      : "text-[#4d4d4d] bg-white border border-[#ebebeb] hover:text-[#171717] hover:border-neutral-300 hover:bg-[#f2f2f2] dark:text-[#a1a1a1] dark:bg-[#0a0a0a] dark:border-[#262626] dark:hover:text-white dark:hover:border-neutral-700 dark:hover:bg-[#171717]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 pl-2 border-l border-[#ebebeb] dark:border-[#262626]">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
