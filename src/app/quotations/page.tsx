import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import { QuotationPipelineView, QuotationSummaryItem } from "@/components/quotations/quotation-pipeline-view";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      ownerRep: true,
      orderLines: true,
    },
  });

  const formattedQuotations: QuotationSummaryItem[] = quotations.map((q) => {
    const total = q.orderLines.reduce((acc, line) => {
      const price = Number(line.unitPrice) * line.quantity;
      const disc = price * (Number(line.discountPercent) / 100);
      return acc + (price - disc);
    }, 0);

    return {
      id: q.id,
      displayCode: q.displayCode,
      customerName: q.customer.name,
      customerTier: q.customer.tier,
      ownerRepName: q.ownerRep?.name || "Unassigned",
      stage: q.stage,
      blendedRisk: q.blendedRiskLevel,
      currency: q.currency,
      itemCount: q.orderLines.length,
      totalValue: total,
      createdAt: q.createdAt.toLocaleDateString(),
      updatedAt: q.updatedAt.toLocaleDateString(),
    };
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuotationPipelineView initialQuotations={formattedQuotations} />
      </main>
    </div>
  );
}
