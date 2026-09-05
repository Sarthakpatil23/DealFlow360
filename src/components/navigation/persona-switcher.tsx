"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { switchPersonaAction } from "@/app/actions/auth-actions";
import { Loader2, Users, ShieldCheck, UserCheck, Briefcase } from "lucide-react";

interface PersonaSwitcherProps {
  currentRole?: string;
  currentName?: string | null;
  compact?: boolean;
}

export function PersonaSwitcher({ currentRole = "REP", currentName, compact = false }: PersonaSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  const personas = [
    {
      role: "REP",
      name: "J. Rao",
      title: "Sales Rep",
      icon: Briefcase,
      color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
      activeColor: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-xs",
    },
    {
      role: "MANAGER",
      name: "M. Shah",
      title: "Sales Manager",
      icon: UserCheck,
      color: "border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20",
      activeColor: "bg-purple-600 text-white dark:bg-purple-500 dark:text-black shadow-xs",
    },
    {
      role: "FINANCE",
      name: "R. Iyer",
      title: "Finance",
      icon: ShieldCheck,
      color: "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20",
      activeColor: "bg-blue-600 text-white dark:bg-blue-500 dark:text-black shadow-xs",
    },
    {
      role: "ADMIN",
      name: "Admin",
      title: "Admin",
      icon: Users,
      color: "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
      activeColor: "bg-amber-600 text-white dark:bg-amber-500 dark:text-black shadow-xs",
    },
  ];

  function handleSwitch(role: string) {
    if (role === currentRole || isPending) return;
    setSwitchingRole(role);
    startTransition(async () => {
      try {
        await switchPersonaAction(role as any);
      } catch (err) {
        // Next.js redirection will handle completion
      }
    });
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium hidden md:inline">
          Switch:
        </span>
        <div className="inline-flex rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-2xs">
          {personas.map((p) => {
            const isActive = currentRole === p.role;
            const isThisSwitching = isPending && switchingRole === p.role;

            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSwitch(p.role)}
                disabled={isPending || isActive}
                title={`Switch to ${p.title} (${p.name})`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isActive
                    ? p.activeColor
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                }`}
              >
                {isThisSwitching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <p.icon className="h-3 w-3" />
                )}
                <span>{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xs p-3 sm:p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Persona Simulator
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Live RBAC
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
              Current Session:{" "}
              <strong className="text-neutral-900 dark:text-white font-semibold">
                {currentName || "Demo User"}
              </strong>{" "}
              — switch roles below to see real-time UI, metrics, and permissions update:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:self-auto">
          {personas.map((p) => {
            const isActive = currentRole === p.role;
            const isThisSwitching = isPending && switchingRole === p.role;

            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSwitch(p.role)}
                disabled={isPending || isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? `${p.activeColor} border-transparent shadow-xs cursor-default ring-2 ring-primary/20`
                    : "border-border/80 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 cursor-pointer disabled:opacity-50"
                }`}
              >
                {isThisSwitching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <p.icon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {p.title} <span className="opacity-75 font-normal">({p.name})</span>
                </span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
