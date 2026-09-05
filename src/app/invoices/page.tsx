import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import { InvoicesListView, InvoiceListItem } from "@/components/invoices/invoices-list-view";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      quotation: true,
      subscription: true,
    },
  });

  const formattedInvoices: InvoiceListItem[] = invoices.map((inv) => ({
    id: inv.id,
    displayCode: inv.displayCode,
    customerName: inv.customer.name,
    customerTier: inv.customer.tier,
    quotationCode: inv.quotation?.displayCode,
    subscriptionPlanName: inv.subscription?.planName,
    type: inv.type,
    amount: Number(inv.amount),
    status: inv.status,
    dueDate: inv.dueDate.toLocaleDateString(),
    paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString() : null,
    createdAt: inv.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoicesListView initialInvoices={formattedInvoices} />
      </main>
    </div>
  );
}
