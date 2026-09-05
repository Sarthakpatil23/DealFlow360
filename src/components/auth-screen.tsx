"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { loginWithCredentials, signupAction } from "@/app/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export function AuthScreen({ className }: { className?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up fields
  const [name, setName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [accountType, setAccountType] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");
  const [role, setRole] = useState("REP");
  const [companyName, setCompanyName] = useState("");

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

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
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("accountType", accountType);
    formData.append("name", name);
    formData.append("email", signUpEmail);
    formData.append("password", signUpPassword);
    formData.append("role", role);
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
      setError("An error occurred during sign up. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground",
        className
      )}
    >
      {/* Left Side: Minimal Auth Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-lg mx-auto w-full">
        {/* Brand Header & Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs">
              DF
            </div>
            <span className="font-semibold text-sm tracking-tight">
              DealFlow360
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Center Form */}
        <div className="my-auto py-8">
          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in to your account" : "Create an account"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "signin"
                ? "Enter your credentials below to access your workspace."
                : "Fill in your details below to get started."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground/80"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-foreground/80"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-name"
                  className="text-xs font-medium text-foreground/80"
                >
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="text-xs font-medium text-foreground/80"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-password"
                  className="text-xs font-medium text-foreground/80"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              {/* Account Domain Toggle */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAccountType("INTERNAL")}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition-all",
                    accountType === "INTERNAL"
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-input text-muted-foreground hover:bg-muted"
                  )}
                >
                  Internal Staff
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("CUSTOMER")}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition-all",
                    accountType === "CUSTOMER"
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-input text-muted-foreground hover:bg-muted"
                  )}
                >
                  Customer Portal
                </button>
              </div>

              {accountType === "INTERNAL" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="REP">Sales Rep</option>
                    <option value="MANAGER">Sales Manager</option>
                    <option value="FINANCE">Finance</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Company name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-medium text-foreground underline hover:text-foreground/80 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-medium text-foreground underline hover:text-foreground/80 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/60 text-center lg:text-left">
          DealFlow360 &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Right Side: 50% width of screen, 100vh full-bleed hero image */}
      <div className="hidden lg:block relative w-full h-screen sticky top-0 bg-black overflow-hidden border-l border-border/40 select-none">
        <Image
          src="/images/auth-hero.jpg"
          alt="DealFlow360 Hero Visual"
          fill
          priority
          quality={100}
          className="object-cover object-center"
          sizes="50vw"
        />
        {/* Subtle decorative gradient overlays for a polished seamless look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
