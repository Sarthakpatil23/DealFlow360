import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import { Plus, ArrowRight, FileText } from "lucide-react";

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      orderLines: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
              Screen 3 — Quotations List (Pipeline)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select a quotation below to open Screen 4 (Quotation Detail / Builder)
            </p>
          </div>
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 bg-[#0070f3] text-white hover:bg-[#0761d1] px-4 py-2 rounded-full text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            + New Quotation
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {quotations.map((q) => {
                  const total = q.orderLines.reduce((acc, line) => {
                    const price = Number(line.unitPrice) * line.quantity;
                    const disc = price * (Number(line.discountPercent) / 100);
                    return acc + (price - disc);
                  }, 0);

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <Link
                          href={`/quotations/${q.displayCode}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                          {q.displayCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {q.customer.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">
                          {q.customer.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            q.stage === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                              : q.stage === "PENDING_APPROVAL"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
                              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-300 border-border"
                          }`}
                        >
                          {q.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {q.orderLines.length}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/quotations/${q.displayCode}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0070f3] hover:underline"
                        >
                          Open Builder
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
