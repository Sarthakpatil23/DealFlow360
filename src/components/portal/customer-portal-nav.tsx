"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/app/actions/auth-actions";
import {
  Building2,
  LogOut,
  FileText,
  Truck,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface CustomerPortalNavProps {
  customerName?: string;
  customerTier?: string;
  userEmail?: string;
  activeTab?: "orders" | "quotes" | "billing";
  onTabChange?: (tab: "orders" | "quotes" | "billing") => void;
}

export function CustomerPortalNav({
  customerName = "Customer Account",
  customerTier = "STANDARD",
  userEmail,
  activeTab,
  onTabChange,
}: CustomerPortalNavProps) {
  const pathname = usePathname();

  const tierColors: Record<string, string> = {
    GOLD: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    SILVER: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    BRONZE: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  };

  const tierBadge = tierColors[customerTier] || "bg-muted text-muted-foreground border-border";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Customer Context */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/portal"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                CP
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                  Customer Portal
                  <span className="text-[10px] font-normal text-muted-foreground hidden sm:inline">
                    • DealFlow360
                  </span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                  {customerName}
                </span>
              </div>
            </Link>

            <span
              className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${tierBadge}`}
            >
              {customerTier} TIER
            </span>
          </div>

          {/* Customer Navigation Tabs */}
          {onTabChange ? (
            <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <button
                onClick={() => onTabChange("orders")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Orders & Shipments
              </button>

              <button
                onClick={() => onTabChange("quotes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "quotes"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Quotations & Proposals
              </button>

              <button
                onClick={() => onTabChange("billing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "billing"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Invoices & Subscriptions
              </button>
            </nav>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link href="/portal" className="hover:text-foreground transition-colors">
                Portal Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-foreground font-semibold">Active Workspace</span>
            </div>
          )}

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden lg:inline text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                {userEmail}
              </span>
            )}

            <ThemeToggle />

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
