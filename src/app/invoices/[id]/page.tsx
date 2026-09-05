import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import {
  InvoiceDetailView,
  InvoiceDetailItem,
} from "@/components/invoices/invoice-detail-view";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: PageProps) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [{ id: params.id }, { displayCode: params.id }],
    },
    include: {
      customer: true,
      quotation: {
        include: {
          fulfillment: {
            include: { lines: true },
          },
        },
      },
      subscription: true,
    },
  });

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans">
        <TopNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center max-w-md mx-auto">
            <h2 className="text-lg font-semibold">Invoice Not Found</h2>
            <p className="text-xs text-neutral-500 mt-2">
              Could not find invoice matching &quot;{params.id}&quot;.
            </p>
            <Link
              href="/invoices"
              className="mt-4 inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold"
            >
              Back to Invoices
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch related customer invoices
  const related = await prisma.invoice.findMany({
    where: {
      customerId: invoice.customerId,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Check if physical shipment has occurred
  const hasShippedLines = Boolean(
    invoice.quotation?.fulfillment?.lines.some((l) => l.shippedAt)
  );

  const detailItem: InvoiceDetailItem = {
    id: invoice.id,
    displayCode: invoice.displayCode,
    type: invoice.type,
    amount: Number(invoice.amount),
    status: invoice.status,
    dueDate: invoice.dueDate.toLocaleDateString(),
    paidAt: invoice.paidAt ? invoice.paidAt.toLocaleDateString() : null,
    createdAt: invoice.createdAt.toLocaleDateString(),
    customerId: invoice.customerId,
    customerName: invoice.customer.name,
    customerTier: invoice.customer.tier,
    quotationId: invoice.quotation?.id,
    quotationCode: invoice.quotation?.displayCode,
    quotationStage: invoice.quotation?.stage,
    subscriptionId: invoice.subscription?.id,
    subscriptionPlanName: invoice.subscription?.planName,
    isShipped: hasShippedLines || invoice.type === "RECURRING",
    relatedInvoices: related.map((r) => ({
      id: r.id,
      displayCode: r.displayCode,
      type: r.type,
      amount: Number(r.amount),
      status: r.status,
      dueDate: r.dueDate.toLocaleDateString(),
    })),
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoiceDetailView initialInvoice={detailItem} />
      </main>
    </div>
  );
}
