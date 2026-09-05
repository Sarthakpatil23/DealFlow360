"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { switchPersonaAction } from "@/app/actions/auth-actions";
import {
  User,
  Shield,
  Briefcase,
  DollarSign,
  Building2,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface PersonaOption {
  name: string;
  roleTitle: string;
  email: string;
  roleKey: "REP" | "MANAGER" | "FINANCE" | "ADMIN" | "CUSTOMER";
  badgeClass: string;
  description: string;
}

export const CANONICAL_PERSONAS: PersonaOption[] = [
  {
    name: "J. Rao",
    roleTitle: "Sales Rep",
    email: "rep.rao@dealflow.com",
    roleKey: "REP",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    description: "Builds deals, discounts, responds to customer counter-offers",
  },
  {
    name: "M. Shah",
    roleTitle: "Sales Manager",
    email: "mshah@dealflow.com",
    roleKey: "MANAGER",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    description: "Step 1 Approver on flagged deals, team pipeline oversight",
  },
  {
    name: "R. Iyer",
    roleTitle: "Finance & Ops",
    email: "riyer@dealflow.com",
    roleKey: "FINANCE",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    description: "Step 2 Approver on high-risk deals, warehouse fulfillment & billing",
  },
  {
    name: "Admin User",
    roleTitle: "Administrator",
    email: "admin@dealflow.com",
    roleKey: "ADMIN",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    description: "Product catalog, discount ceilings & approval threshold rules",
  },
  {
    name: "Acme Corp",
    roleTitle: "Customer Portal",
    email: "procurement@acme.com",
    roleKey: "CUSTOMER",
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    description: "Screen 11 negotiation portal, counter-discounts & live orders",
  },
];

interface PersonaSwitcherProps {
  currentUserEmail?: string;
  currentUserRole?: string;
  currentUserName?: string;
}

export function PersonaSwitcher({
  currentUserEmail,
  currentUserRole,
  currentUserName,
}: PersonaSwitcherProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current active persona
  const activePersona =
    CANONICAL_PERSONAS.find(
      (p) =>
        p.email.toLowerCase() === currentUserEmail?.toLowerCase() ||
        p.roleKey === currentUserRole
    ) || CANONICAL_PERSONAS[0];

  function handleSelectPersona(persona: PersonaOption) {
    if (persona.email.toLowerCase() === currentUserEmail?.toLowerCase()) {
      setIsOpen(false);
      return;
    }

    setSwitchingEmail(persona.email);
    setIsOpen(false);

    startTransition(async () => {
      await switchPersonaAction(persona.email, pathname);
    });
  }

  function getIconForRole(roleKey: string) {
    switch (roleKey) {
      case "MANAGER":
        return <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case "FINANCE":
        return <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case "ADMIN":
        return <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case "CUSTOMER":
        return <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/70 text-xs font-medium text-foreground transition-all shadow-2xs hover:shadow-xs"
        title="Switch active user persona (project.md)"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          getIconForRole(activePersona.roleKey)
        )}

        <div className="flex items-center gap-1.5 text-left">
          <span className="font-semibold">{activePersona.name}</span>
          <span
            className={`hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${activePersona.badgeClass}`}
          >
            {activePersona.roleTitle}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-border bg-popover p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
          <div className="px-3 py-2 border-b border-border/60 mb-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Active Persona Switcher
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                project.md roles
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Instantly switch sessions to experience the end-to-end approval chain and customer negotiation.
            </p>
          </div>

          <div className="space-y-1">
            {CANONICAL_PERSONAS.map((persona) => {
              const isSelected =
                persona.email.toLowerCase() === currentUserEmail?.toLowerCase() ||
                persona.roleKey === currentUserRole;
              const isBeingSwitched = switchingEmail === persona.email;

              return (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  disabled={isPending}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-muted/80 text-foreground border border-border/80 shadow-2xs"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isBeingSwitched ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      getIconForRole(persona.roleKey)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {persona.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${persona.badgeClass}`}
                      >
                        {persona.roleTitle}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {persona.description}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-border/60 px-3 py-1 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Pass: <code className="font-mono text-foreground font-semibold">password123</code></span>
            <span>Live Session Login</span>
          </div>
        </div>
      )}
    </div>
  );
}
