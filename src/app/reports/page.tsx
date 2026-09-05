import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import {
  ReportsDashboardView,
  ReportQuoteItem,
  RepOption,
} from "@/components/reports/reports-dashboard-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [quotations, reps] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        ownerRep: true,
        orderLines: {
          include: { product: true },
        },
        approvalSteps: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["REP", "MANAGER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const formattedQuotes: ReportQuoteItem[] = quotations.map((q) => {
    let totalValue = 0;
    let hasUpsell = false;

    const orderLines = q.orderLines.map((l) => {
      const gross = Number(l.unitPrice) * l.quantity;
      const disc = gross * (Number(l.discountPercent) / 100);
      totalValue += gross - disc;

      if (l.isUpsellAdd) hasUpsell = true;

      return {
        productName: l.product.name,
        category: l.product.category,
        isUpsellAdd: l.isUpsellAdd,
        quantity: l.quantity,
      };
    });

    // Approximate approval time from audit or approval step acted dates
    let approvalHours = 0;
    const actedStep = q.approvalSteps.find((s) => s.actedAt);
    if (actedStep && actedStep.actedAt) {
      const ms = actedStep.actedAt.getTime() - q.createdAt.getTime();
      approvalHours = Math.max(0.5, Math.round((ms / (1000 * 60 * 60)) * 10) / 10);
    } else if (q.stage === "APPROVED" || q.stage === "CONFIRMED") {
      approvalHours = 4.5;
    }

    return {
      id: q.id,
      displayCode: q.displayCode,
      customerId: q.customerId,
      customerName: q.customer.name,
      customerTier: q.customer.tier,
      ownerRepName: q.ownerRep?.name || "Unassigned",
      stage: q.stage,
      blendedRisk: q.blendedRiskLevel,
      totalValue,
      itemCount: q.orderLines.length,
      hasUpsell,
      approvalHours,
      createdAt: q.createdAt.toISOString(),
      createdDateDisplay: q.createdAt.toLocaleDateString(),
      orderLines,
    };
  });

  const repOptions: RepOption[] = reps.map((r) => ({
    id: r.id,
    name: r.name,
  }));

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportsDashboardView initialQuotes={formattedQuotes} reps={repOptions} />
      </main>
    </div>
  );
}
