"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginWithCredentials, signupAction } from "@/app/actions/auth-actions";
import { 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Lock
} from "lucide-react";

interface DemoAccount {
  label: string;
  role: string;
  email: string;
  desc: string;
  icon: React.ReactNode;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Admin User",
    role: "ADMIN",
    email: "admin@dealflow.com",
    desc: "Platform governance & catalog",
    icon: <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
  },
  {
    label: "J. Rao (Rep)",
    role: "REP",
    email: "jrao@dealflow.com",
    desc: "CPQ quote builder & pipeline",
    icon: <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  },
  {
    label: "M. Shah (Manager)",
    role: "MANAGER",
    email: "mshah@dealflow.com",
    desc: "Tier approvals & deal health",
    icon: <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
  },
  {
    label: "R. Iyer (Finance)",
    role: "FINANCE",
    email: "riyer@dealflow.com",
    desc: "High risk & billing splits",
    icon: <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  },
  {
    label: "Beta Ind (Customer)",
    role: "CUSTOMER",
    email: "buyer@betaind.com",
    desc: "Client negotiation portal",
    icon: <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
];

export function AuthScreen({ className }: { className?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("password123");

  // Sign up fields
  const [accountType, setAccountType] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState("REP");
  const [companyName, setCompanyName] = useState("");

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", signInEmail);
    formData.append("password", signInPassword);

    try {
      const res = await loginWithCredentials(undefined, formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("Failed to sign in. Please verify your email and password.");
      setLoading(false);
    }
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("accountType", accountType);
    formData.append("name", signUpName);
    formData.append("email", signUpEmail);
    formData.append("password", signUpPassword);
    formData.append("role", signUpRole);
    if (accountType === "CUSTOMER") {
      formData.append("companyName", companyName);
    }

    try {
      const res = await signupAction(undefined, formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred during account creation.");
      setLoading(false);
    }
  }

  function handleSelectDemo(acc: DemoAccount) {
    setSignInEmail(acc.email);
    setSignInPassword("password123");
    setError(null);
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-5xl", className)}>
      <Card className="overflow-hidden border border-border shadow-sm bg-card transition-colors duration-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Interactive Auth Form */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              {/* Header with Brand & Theme Toggle */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary text-primary-foreground font-semibold shadow-xs">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold tracking-tight text-foreground">
                      DealFlow360
                    </h1>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Sales Ops & CPQ Engine
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={cn(
                    "py-1.5 text-xs font-medium rounded-md transition-all",
                    mode === "signin"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={cn(
                    "py-1.5 text-xs font-medium rounded-md transition-all",
                    mode === "signup"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Create Account
                </button>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {mode === "signin" && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Welcome back
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Enter your credentials or choose a seeded role to proceed
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs font-medium text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="rep@dealflow.com"
                        className="h-9 rounded-[6px] text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-xs font-medium text-foreground">
                          Password
                        </Label>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          demo: password123
                        </span>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 rounded-[6px] text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-9 rounded-[6px] text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {loading ? "Authenticating..." : "Sign In to DealFlow360"}
                    </Button>
                  </div>

                  {/* Seeded Role Direct Selectors */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        One-Click Seeded Roles (Offline Demo)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        5 preconfigured
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => handleSelectDemo(acc)}
                          className={cn(
                            "flex items-start gap-2.5 p-2 rounded-[6px] border text-left transition-all",
                            signInEmail === acc.email
                              ? "border-primary bg-accent ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/40 hover:bg-muted/50"
                          )}
                        >
                          <div className="mt-0.5">{acc.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground truncate">
                                {acc.label}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-muted text-muted-foreground rounded">
                                {acc.role}
                              </span>
                            </div>
                            <span className="block text-[10px] text-muted-foreground font-mono truncate">
                              {acc.email}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* SIGN UP FORM */}
              {mode === "signup" && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Create an account
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Register a new sales staff member or client portal user
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAccountType("INTERNAL")}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-[6px] border text-xs font-medium transition-all text-center",
                        accountType === "INTERNAL"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Internal Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("CUSTOMER")}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-[6px] border text-xs font-medium transition-all text-center",
                        accountType === "CUSTOMER"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Customer Portal
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-xs font-medium text-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="h-9 rounded-[6px] text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-foreground">
                        Work Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="h-9 rounded-[6px] text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-medium text-foreground">
                        Password (min 6 chars)
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        minLength={6}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 rounded-[6px] text-xs"
                      />
                    </div>

                    {accountType === "INTERNAL" ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-role" className="text-xs font-medium text-foreground">
                          Operational Role
                        </Label>
                        <select
                          id="signup-role"
                          value={signUpRole}
                          onChange={(e) => setSignUpRole(e.target.value)}
                          className="w-full h-9 rounded-[6px] border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="REP">Sales Representative (Quotation Builder)</option>
                          <option value="MANAGER">Sales Manager (Level 1 Approval)</option>
                          <option value="FINANCE">Finance / Operations (Level 2 Approval)</option>
                          <option value="ADMIN">System Administrator</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-company" className="text-xs font-medium text-foreground">
                          Organization / Company Name
                        </Label>
                        <Input
                          id="signup-company"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Global Industries"
                          className="h-9 rounded-[6px] text-xs"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-9 rounded-[6px] text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {loading ? "Creating Account..." : "Register & Sign In"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-emerald-500" />
                Bcrypt Hashed & Auth.js JWT
              </span>
              <span>Screen 1: Auth</span>
            </div>
          </div>

          {/* Right Column: Vercel Geist Signature Mesh Gradient Panel */}
          <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-10 border-l border-border bg-black text-white overflow-hidden">
            {/* Mesh gradient background overlay */}
            <div className="absolute inset-0 mesh-gradient-bg opacity-90 pointer-events-none" />

            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }}
            />

            {/* Top Brand Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-mono text-neutral-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OFFLINE DEMO READY · 100% LOCAL
              </div>
              <span className="text-[11px] font-mono text-neutral-400">ODOO 2026 SPEC</span>
            </div>

            {/* Center Visual: Real Engine Card Preview */}
            <div className="relative z-10 my-auto py-8 space-y-4">
              <div className="space-y-2">
                <div className="inline-block text-[11px] font-mono tracking-wider uppercase text-cyan-300">
                  Real-time Governance Engine
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Multi-Tier CPQ & Blended Risk Scoring
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm">
                  Automatic tier ceilings, category limits, warehouse fulfillment splitting, and proration logic.
                </p>
              </div>

              {/* Master Deal Card preview */}
              <div className="rounded-lg border border-white/15 bg-black/60 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white">Q-1042</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                      Acme Corp (Gold)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    PENDING APPROVAL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-white/5 p-2 border border-white/5">
                    <span className="block text-[10px] text-neutral-400">Blended Risk Level</span>
                    <span className="font-semibold text-red-400">HIGH RISK</span>
                  </div>
                  <div className="rounded bg-white/5 p-2 border border-white/5">
                    <span className="block text-[10px] text-neutral-400">Required Path</span>
                    <span className="font-semibold text-cyan-300">Manager → Finance</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Stock Verified across 2 Warehouses
                  </span>
                  <span className="font-mono text-white font-medium">$3,030.00</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Quote */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Geist Design System</span>
              <span className="font-mono text-neutral-300">Next.js 14 App Router</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
