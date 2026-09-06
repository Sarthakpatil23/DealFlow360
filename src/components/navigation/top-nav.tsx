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

export interface TopNavProps {
  userEmail?: string;
  userRole?: string;
  userName?: string;
}

export function TopNav({ userEmail, userRole, userName }: TopNavProps = {}) {
  const pathname = usePathname();
  const [isLoggingOut, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <header className="w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40 transition-colors duration-150 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
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

        {/* Center Navigation Links with Hidden Scrollbar */}
        <nav
          className="flex items-center gap-1 overflow-x-auto overflow-y-hidden no-scrollbar py-1 shrink min-w-0"
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
                className={`text-xs sm:text-[13px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap font-medium ${
                  isActive
                    ? "bg-[#171717] text-white border border-[#171717] dark:bg-[#ededed] dark:text-[#171717] dark:border-[#ededed] shadow-xs"
                    : "text-[#4d4d4d] bg-transparent border border-transparent hover:text-[#171717] hover:border-border hover:bg-muted/50 dark:text-[#a1a1a1] dark:hover:text-white dark:hover:border-border dark:hover:bg-muted/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Persona Switcher, Theme Toggle & Logout (Pinned, Never Scrolling) */}
        <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-border/80">
          <PersonaSwitcher
            currentUserEmail={userEmail}
            currentUserRole={userRole}
            currentUserName={userName}
          />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign Out"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
