import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  LogOut,
  Building2,
  Package,
  Layers,
  Truck,
  Repeat,
  Receipt,
  Activity,
  BarChart3,
  Sliders
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "CUSTOMER") {
    redirect("/portal");
  }

  const role = session.user.role;

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    MANAGER: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    FINANCE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    REP: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  };

  const currentRoleStyle = roleColors[role] || {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-200",
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-neutral-900 flex items-center justify-center text-white font-bold text-xs">
                DF
              </div>
              <span className="font-semibold text-sm tracking-tight text-neutral-900">
                DealFlow360
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-600">
              <Link
                href="/dashboard"
                className="rounded px-2.5 py-1.5 text-neutral-900 bg-neutral-100 font-semibold"
              >
                Dashboard
              </Link>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Quotations
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Approvals
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Fulfillment
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Subscriptions
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Invoices
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Deal Health
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Reports
              </span>
              <span className="rounded px-2.5 py-1.5 hover:text-neutral-900 text-neutral-500 cursor-not-allowed">
                Products
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {role}
            </span>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-medium text-neutral-900">
                {session.user.name || session.user.email}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {session.user.email}
              </div>
            </div>

            <ThemeToggle />

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Welcome & Actions Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium">
              Screen 2 — Sales Operations Command
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
              Sales Dashboard
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Welcome back, {session.user.name}. Authenticated with role{" "}
              <span className="font-semibold text-neutral-800">{role}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Quotation
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 transition-colors"
            >
              View Approvals
            </button>
          </div>
        </div>

        {/* Three Master KPI Summary Cards (Per project.md Screen 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-300 transition-all">
            <div className="flex items-center justify-between text-neutral-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">
                Pending Approvals
              </span>
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900">
              4 quotations
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Awaiting manager and finance review
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-300 transition-all">
            <div className="flex items-center justify-between text-neutral-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">
                Open Quotations
              </span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900">
              12 active deals
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Across Draft, Approved, and Negotiation
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-300 transition-all">
            <div className="flex items-center justify-between text-neutral-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">
                At-Risk Deals
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900">
              3 flagged deals
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Flagged by Deal Health engine
            </p>
          </div>
        </div>

        {/* Internal Role Navigation Grid */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Operational Modules
              </h2>
              <p className="text-xs text-neutral-500">
                Role-authorized workflow areas
              </p>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Role: {role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-neutral-150 p-3 bg-neutral-50/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <FileText className="h-4 w-4 text-neutral-700" />
                Quotations Pipeline
              </div>
              <p className="text-[11px] text-neutral-500">
                5-stage Kanban view (Draft, Approvals, Negotiation, Confirmed).
              </p>
            </div>

            <div className="rounded-lg border border-neutral-150 p-3 bg-neutral-50/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <CheckCircle2 className="h-4 w-4 text-neutral-700" />
                Approvals Center
              </div>
              <p className="text-[11px] text-neutral-500">
                Manager & Finance sign-off queue with blended risk scores.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-150 p-3 bg-neutral-50/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <Truck className="h-4 w-4 text-neutral-700" />
                Fulfillment & Stock
              </div>
              <p className="text-[11px] text-neutral-500">
                Automated multi-warehouse split, reservations, and backorders.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-150 p-3 bg-neutral-50/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <Repeat className="h-4 w-4 text-neutral-700" />
                Subscriptions & Billing
              </div>
              <p className="text-[11px] text-neutral-500">
                Recurring schedules, mid-cycle proration, and invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed (Per project.md Screen 2) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              Recent System Activity
            </h2>
            <span className="text-[11px] text-neutral-400">Live feed</span>
          </div>

          <ul className="divide-y divide-neutral-100 text-xs">
            <li className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-neutral-800">
                  Acme Corp quotation (Q-1042) approved by Finance
                </span>
              </div>
              <span className="text-neutral-400 text-[11px] font-mono">10m ago</span>
            </li>
            <li className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-medium text-neutral-800">
                  Beta Industries requested a discount change (8% counter)
                </span>
              </div>
              <span className="text-neutral-400 text-[11px] font-mono">25m ago</span>
            </li>
            <li className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-neutral-400" />
                <span className="font-medium text-neutral-800">
                  East Depot stock updated for Order #2291
                </span>
              </div>
              <span className="text-neutral-400 text-[11px] font-mono">1h ago</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
