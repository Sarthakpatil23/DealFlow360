"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/app/actions/auth-actions";
import { LogOut, Loader2 } from "lucide-react";

import { PersonaSwitcher } from "@/components/navigation/persona-switcher";

export interface NavItem {
  label: string;
  href: string;
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Quotations", href: "/quotations" },
  { label: "Approvals", href: "/approvals" },
  { label: "Fulfillment", href: "/fulfillment" },
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Invoices", href: "/invoices" },
  { label: "Deal Health", href: "/deal-health" },
  { label: "Discount Rules", href: "/discount-approval-setup", roles: ["MANAGER", "ADMIN"] },
  { label: "Reports", href: "/reports" },
  { label: "Products", href: "/products" },
];

export interface TopNavProps {
  currentRole?: string;
  currentName?: string | null;
}

export function TopNav({ currentRole, currentName }: TopNavProps = {}) {
  const pathname = usePathname();
  const [isLoggingOut, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

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

        {/* Navigation Items, Theme Toggle & Logout */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-full">
          <nav
            className="flex items-center gap-1.5"
            aria-label="Internal Navigation"
          >
            {NAV_ITEMS.filter((item) => {
              if (item.roles && currentRole && !item.roles.includes(currentRole)) {
                return false;
              }
              return true;
            }).map((item) => {
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

          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-[#ebebeb] dark:border-[#262626]">
            <PersonaSwitcher currentRole={currentRole} currentName={currentName} compact={true} />
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 border border-[#ebebeb] dark:border-[#262626] rounded-md transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
