"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Building2,
  Search,
  Check,
  ChevronDown,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
  Filter,
} from "lucide-react";

export interface CustomerOption {
  id: string;
  name: string;
  tier: string;
  preferredCurrency?: string;
}

interface CustomerComboboxSelectorProps {
  customers: CustomerOption[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  disabled?: boolean;
}

export function CustomerComboboxSelector({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  disabled = false,
}: CustomerComboboxSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | "GOLD" | "SILVER" | "BRONZE">("ALL");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedTierFilter("ALL");
    }
  }, [isOpen]);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Current selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tier filter
      if (selectedTierFilter !== "ALL" && c.tier !== selectedTierFilter) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.tier.toLowerCase().includes(query) ||
        (c.preferredCurrency || "USD").toLowerCase().includes(query)
      );
    });
  }, [customers, selectedTierFilter, searchQuery]);

  function getTierBadgeClass(tier: string) {
    switch (tier) {
      case "GOLD":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "SILVER":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
      case "BRONZE":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  }

  function getTierCeilingPercent(tier: string) {
    switch (tier) {
      case "GOLD":
        return 15;
      case "SILVER":
        return 10;
      default:
        return 5;
    }
  }

  function getMonogram(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-2 font-sans">
      {/* Target Customer Card Header & Summary */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          Target Customer Organization
        </span>

        {currentCustomer && (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${getTierBadgeClass(
              currentCustomer.tier
            )}`}
          >
            {currentCustomer.tier} TIER ({getTierCeilingPercent(currentCustomer.tier)}% MAX)
          </span>
        )}
      </div>

      {/* Selected Customer Display Box with 1-Click "Change Customer" Action */}
      {currentCustomer ? (
        <div className="rounded-xl border border-border/80 bg-background p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs border ${getTierBadgeClass(
                currentCustomer.tier
              )}`}
            >
              {getMonogram(currentCustomer.name)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground truncate">
                  {currentCustomer.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  ({currentCustomer.preferredCurrency || "USD"})
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Ceiling: <strong>{getTierCeilingPercent(currentCustomer.tier)}%</strong> manual discount limit
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shrink-0 shadow-2xs"
            >
              Change <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="w-full h-10 rounded-xl border border-dashed border-border/80 hover:border-primary bg-background hover:bg-muted/30 px-3.5 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          Select Target Customer Organization...
        </button>
      )}

      {/* Searchable Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Select Target Customer
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose an organization to automatically apply customer tier discount limits & price list breaks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by company name, tier, or currency..."
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tier Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">
                Tier:
              </span>
              {(["ALL", "GOLD", "SILVER", "BRONZE"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTierFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors whitespace-nowrap border ${
                    selectedTierFilter === tier
                      ? "bg-foreground text-background border-foreground font-semibold shadow-2xs"
                      : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tier === "ALL" ? "All Tiers" : `${tier} (${getTierCeilingPercent(tier)}% Max)`}
                </button>
              ))}
            </div>

            {/* Customers Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No customers found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const isSelected = customer.id === selectedCustomerId;
                  const tierClass = getTierBadgeClass(customer.tier);
                  const ceiling = getTierCeilingPercent(customer.tier);

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(customer.id);
                        setIsOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-2xs"
                          : "border-border/60 bg-background hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 border ${tierClass}`}
                        >
                          {getMonogram(customer.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {customer.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${tierClass}`}
                            >
                              {customer.tier} TIER
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>Currency: <strong>{customer.preferredCurrency || "USD"}</strong></span>
                            <span>•</span>
                            <span>Discount Ceiling: <strong>{ceiling}% Max</strong></span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 shrink-0">
                          Select →
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredCustomers.length} customer organizations</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
