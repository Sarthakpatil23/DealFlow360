"use client";

import { useState } from "react";
import { loginWithCredentials, signupAction } from "@/app/actions/auth-actions";
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  Lock, 
  Mail, 
  Info, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  X
} from "lucide-react";

interface SeededAccount {
  label: string;
  role: string;
  email: string;
  destination: string;
}

const SEEDED_ACCOUNTS: SeededAccount[] = [
  { label: "Admin", role: "ADMIN", email: "admin@dealflow.com", destination: "Sales Dashboard" },
  { label: "Sales Rep (J. Rao)", role: "REP", email: "jrao@dealflow.com", destination: "Sales Dashboard" },
  { label: "Sales Manager (M. Shah)", role: "MANAGER", email: "mshah@dealflow.com", destination: "Sales Dashboard" },
  { label: "Finance (R. Iyer)", role: "FINANCE", email: "riyer@dealflow.com", destination: "Sales Dashboard" },
  { label: "Customer (Beta Ind)", role: "CUSTOMER", email: "buyer@betaind.com", destination: "Quotation Portal" },
];

export function LoginForm() {
  const [activeTab, setActiveTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [accountType, setAccountType] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");
  const [selectedTeam, setSelectedTeam] = useState("Enterprise Sales (US-East)");

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("password123");

  // Signup form states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("REP");
  const [signupCompanyName, setSignupCompanyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", loginEmail);
    formData.append("password", loginPassword);

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
      setError("An unexpected error occurred during login. Please retry.");
      setLoading(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("accountType", accountType);
    formData.append("name", signupName);
    formData.append("email", signupEmail);
    formData.append("password", signupPassword);
    formData.append("role", signupRole);
    formData.append("companyName", signupCompanyName);

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

  function handleSelectSeeded(acc: SeededAccount) {
    setActiveTab("LOGIN");
    setLoginEmail(acc.email);
    setLoginPassword("password123");
    setError(null);
  }

  return (
    <div className="w-full max-w-lg space-y-5">
      {/* Dynamic Role Destination Banner (Per project.md Screen 1) */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm text-xs">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-neutral-700 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <span className="font-semibold text-neutral-900 block">
              Unified Role-Aware Access Hub
            </span>
            <p className="text-neutral-500 leading-relaxed">
              Upon authentication, internal staff (
              <span className="font-medium text-neutral-700">Rep, Manager, Finance, Admin</span>
              ) land on the{" "}
              <strong className="text-neutral-900 font-semibold">Sales Dashboard</strong>.
              Customers land exclusively on their scoped{" "}
              <strong className="text-emerald-700 font-semibold">Quotation Portal</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
        {/* Toggle: Log In / Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-lg mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("LOGIN");
              setError(null);
            }}
            className={`py-2 rounded-md transition-all ${
              activeTab === "LOGIN"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("SIGNUP");
              setError(null);
            }}
            className={`py-2 rounded-md transition-all ${
              activeTab === "SIGNUP"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {activeTab === "LOGIN" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Team / Workspace Selector (Per project.md Screen 1 rules) */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Workspace / Sales Organization
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-800 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
              >
                <option value="Enterprise Sales (US-East)">Enterprise Sales (US-East)</option>
                <option value="Strategic Mid-Market">Strategic Mid-Market</option>
                <option value="EMEA Operations">EMEA Operations</option>
                <option value="Customer Portal Access">Customer Portal (Global)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. jrao@dealflow.com or buyer@betaind.com"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-700" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Log In to DealFlow360</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {activeTab === "SIGNUP" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* Account Type Selector: Internal Staff vs Customer */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Account Target Domain
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("INTERNAL")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all ${
                    accountType === "INTERNAL"
                      ? "border-neutral-900 bg-neutral-50 text-neutral-900 font-semibold"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Internal Staff
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("CUSTOMER")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all ${
                    accountType === "CUSTOMER"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800 font-semibold"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Customer Portal
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="signup-name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="signup-email">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="signup-password">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            {accountType === "INTERNAL" ? (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Assigned Staff Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-800 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="REP">Sales Rep (Create & Edit Quotes)</option>
                  <option value="MANAGER">Sales Manager (L1 Approvals, Deal Health)</option>
                  <option value="FINANCE">Finance Approver (L2 Approvals, Billing)</option>
                  <option value="ADMIN">Platform Administrator (Global Config)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="signup-company">
                  Customer Organization / Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="signup-company"
                    type="text"
                    required
                    value={signupCompanyName}
                    onChange={(e) => setSignupCompanyName(e.target.value)}
                    placeholder="e.g. Apex Global Tech"
                    className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account & Enter Platform</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 1-Click Fast Seeded Test Logins (Convenience for testing all 5 roles) */}
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              One-Click Seeded Test Personas
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Pass: password123
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEEDED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectSeeded(acc)}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                  loginEmail === acc.email && activeTab === "LOGIN"
                    ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-neutral-900">
                    {acc.label}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                    {acc.role}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 truncate w-full mt-0.5">
                  {acc.email}
                </span>
                <span className="text-[9px] text-neutral-400 mt-1 flex items-center gap-1">
                  Destination: <span className="font-medium text-neutral-600">{acc.destination}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-neutral-700" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              In this DealFlow360 demonstration environment, all seeded staff and customer accounts are initialized with the standard password:
            </p>

            <div className="rounded-md bg-neutral-100 p-2.5 text-center font-mono text-xs font-bold text-neutral-900 select-all">
              password123
            </div>

            <p className="text-[11px] text-neutral-400">
              Select any of the 5 one-click seeded persona buttons on the login screen to automatically fill and sign in.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-lg bg-neutral-900 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
