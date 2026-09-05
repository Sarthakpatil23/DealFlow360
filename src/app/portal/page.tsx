import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";
import { 
  Building2, 
  FileCheck2, 
  Clock, 
  MessageSquare, 
  LogOut, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default async function CustomerPortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Internal users are redirected to their Sales Dashboard
  if (session.user.role !== "CUSTOMER") {
    redirect("/dashboard");
  }

  // Look up customer details if customerId is present
  let customer = null;
  if (session.user.customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: session.user.customerId },
      include: {
        quotations: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            orderLines: true,
          },
        },
      },
    });
  }

  const tierColors: Record<string, string> = {
    GOLD: "bg-amber-100 text-amber-800 border-amber-300",
    SILVER: "bg-slate-100 text-slate-800 border-slate-300",
    BRONZE: "bg-orange-100 text-orange-800 border-orange-300",
  };

  const tierBadge = customer?.tier
    ? tierColors[customer.tier] || "bg-neutral-100 text-neutral-800 border-neutral-200"
    : "bg-neutral-100 text-neutral-800 border-neutral-200";

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans">
      {/* Customer Portal Top Nav */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              CP
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-neutral-900">
                Customer Quotation Portal
              </span>
              <span className="hidden sm:inline text-xs text-neutral-400 ml-2">
                DealFlow360
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Customer User
            </span>

            {customer?.tier && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${tierBadge}`}>
                {customer.tier} TIER
              </span>
            )}

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
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {/* Scoped Access Banner */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-neutral-700" />
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  {customer?.name || session.user.name || "Customer Account"}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Portal account scoped strictly to your organization's deals and quotations.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Currency</span>
                <span className="font-semibold text-neutral-900">{customer?.preferredCurrency || "USD"}</span>
              </div>
              <div className="h-6 w-px bg-neutral-200" />
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Account Email</span>
                <span className="font-mono text-neutral-800">{session.user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quotations Overview for this Customer */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Your Quotations & Proposals
              </h2>
              <p className="text-xs text-neutral-500">
                Review proposals, comment on lines, or submit counter-discounts (Screen 11)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-medium">
              Live Scoped View
            </span>
          </div>

          {customer?.quotations && customer.quotations.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {customer.quotations.map((q) => {
                const total = q.orderLines.reduce((acc, line) => {
                  const linePrice = Number(line.unitPrice) * line.quantity;
                  const discount = linePrice * (Number(line.discountPercent) / 100);
                  return acc + (linePrice - discount);
                }, 0);

                return (
                  <div key={q.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900 font-mono">
                        {q.displayCode}
                      </span>
                      <span className="ml-3 rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                        {q.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-900">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-neutral-400 text-[11px]">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500 text-xs">
              <FileCheck2 className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              No active quotations assigned to your account yet. When your sales representative publishes a proposal, it will appear here for review and negotiation.
            </div>
          )}
        </div>

        {/* Security / Boundary Notice */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-neutral-700">Role-Based Route Protection Active: </span>
            As a Customer Portal user, you are restricted exclusively to your own quotation data. Internal sales operations dashboards, approval queues, and warehouse fulfillment surfaces are blocked.
          </div>
        </div>
      </main>
    </div>
  );
}
