import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { SessionCard } from "@/components/auth/session-card";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#fafafa]">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded bg-neutral-900" />
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            DealFlow360
          </h1>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          B2B Sales Operations, Discount Governance & CPQ Platform
        </p>
      </header>

      {session?.user ? (
        <SessionCard user={session.user} />
      ) : (
        <LoginForm />
      )}

      <footer className="mt-8 text-center text-xs text-neutral-400 space-y-2">
        <div>
          <a
            href="/dashboard"
            className="text-neutral-600 hover:text-neutral-900 underline transition-colors"
          >
            Direct link to Sales Dashboard (Screen 2) →
          </a>
        </div>
        <span>DealFlow360 Step 6 — Auth.js Credentials Provider + Bcrypt</span>
      </footer>
    </main>
  );
}
