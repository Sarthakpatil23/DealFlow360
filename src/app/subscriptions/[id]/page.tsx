import { notFound } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import {
  SubscriptionBillingDetailView,
  SubscriptionBillingDetailData,
  OneTimeLineItem,
  RecurringLineItem,
  InvoiceHistoryItem,
  CreditNoteItem,
} from "@/components/subscriptions/subscription-billing-detail-view";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const sub = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      quotation: {
        include: {
          orderLines: {
            include: {
              product: true,
            },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      creditNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sub) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans">
        <TopNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center max-w-md mx-auto">
            <h2 className="text-lg font-semibold">Subscription Not Found</h2>
            <p className="text-xs text-neutral-500 mt-2">
              Could not find subscription matching ID &quot;{params.id}&quot;.
            </p>
            <Link
              href="/subscriptions"
              className="mt-4 inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold"
            >
              Back to Subscriptions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Also query any other recurring plans for this same customer (to show in the recurring table)
  const allCustomerSubs = await prisma.subscription.findMany({
    where: { customerId: sub.customerId },
    orderBy: { createdAt: "desc" },
  });

  // Split One-time lines from originating quotation
  const oneTimeLines: OneTimeLineItem[] =
    sub.quotation?.orderLines
      ?.filter((l) => !l.product.isSubscription)
      .map((l) => {
        const gross = Number(l.unitPrice) * l.quantity;
        const disc = gross * (Number(l.discountPercent) / 100);
        return {
          id: l.id,
          productName: l.product.name,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent),
          amount: gross - disc,
        };
      }) || [];

  const allRecurringPlans: RecurringLineItem[] = allCustomerSubs.map((s) => ({
    id: s.id,
    planName: s.planName,
    cycle: s.cycle,
    pricePerCycle: Number(s.pricePerCycle),
    nextBillDate: s.nextBillDate ? s.nextBillDate.toLocaleDateString() : null,
    status: s.status as "ACTIVE" | "PAUSED" | "CANCELLED",
  }));

  const invoiceItems: InvoiceHistoryItem[] = sub.invoices.map((inv) => ({
    id: inv.id,
    displayCode: inv.displayCode,
    type: inv.type,
    amount: Number(inv.amount),
    status: inv.status,
    dueDate: inv.dueDate.toLocaleDateString(),
    paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString() : null,
  }));

  const creditNoteItems: CreditNoteItem[] = sub.creditNotes.map((cn) => ({
    id: cn.id,
    amount: Number(cn.amount),
    reason: cn.reason,
    createdAt: cn.createdAt.toLocaleDateString(),
  }));

  const detailData: SubscriptionBillingDetailData = {
    subscriptionId: sub.id,
    customerId: sub.customerId,
    customerName: sub.customer.name,
    customerTier: sub.customer.tier,
    planName: sub.planName,
    cycle: sub.cycle,
    pricePerCycle: Number(sub.pricePerCycle),
    nextBillDate: sub.nextBillDate ? sub.nextBillDate.toLocaleDateString() : null,
    status: sub.status as "ACTIVE" | "PAUSED" | "CANCELLED",
    originatingQuoteCode: sub.quotation?.displayCode,
    originatingQuoteId: sub.quotation?.id,
    oneTimeLines,
    allRecurringPlans,
    invoices: invoiceItems,
    creditNotes: creditNoteItems,
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionBillingDetailView initialData={detailData} />
      </main>
    </div>
  );
}
