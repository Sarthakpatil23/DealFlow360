"use client";

import { useState } from "react";
import { loginWithCredentials } from "@/app/actions/auth-actions";

interface SeededAccount {
  label: string;
  role: string;
  email: string;
}

const SEEDED_ACCOUNTS: SeededAccount[] = [
  { label: "Admin", role: "ADMIN", email: "admin@dealflow.com" },
  { label: "Sales Rep", role: "REP", email: "jrao@dealflow.com" },
  { label: "Manager", role: "MANAGER", email: "mshah@dealflow.com" },
  { label: "Finance", role: "FINANCE", email: "riyer@dealflow.com" },
  { label: "Customer", role: "CUSTOMER", email: "buyer@betaind.com" },
];

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
      // In Next.js Server Actions, redirect throws an error which triggers navigation
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred during login.");
      setLoading(false);
    }
  }

  function handleSelectSeeded(acc: SeededAccount) {
    setEmail(acc.email);
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Sign In to DealFlow360</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Authenticate using seeded Postgres accounts with bcrypt encryption
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@dealflow.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 py-2.5 px-4 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In with Credentials"}
          </button>
        </form>

        <div className="mt-6 border-t border-neutral-100 pt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            One-Click Seeded Test Logins (Password: password123)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SEEDED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectSeeded(acc)}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-colors ${
                  email === acc.email
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <span className="text-xs font-semibold text-neutral-900">{acc.label}</span>
                <span className="text-[10px] text-neutral-500 truncate w-full">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
