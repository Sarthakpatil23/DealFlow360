import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "CUSTOMER") {
      redirect("/portal");
    }
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-[#fafafa]">
      <header className="mb-6 text-center space-y-1">
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            DF
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            DealFlow360
          </h1>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          B2B Sales Operations, Discount Governance & CPQ Platform
        </p>
      </header>

      <LoginForm />

      <footer className="mt-8 text-center text-[11px] text-neutral-400 space-y-1">
        <div>DealFlow360 — Role-Based Access Control & Screen 1 Auth Hub</div>
        <div className="font-mono text-[10px] text-neutral-400">
          REP • MANAGER • FINANCE • ADMIN • CUSTOMER
        </div>
      </footer>
    </main>
  );
}
