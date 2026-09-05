import { TopNav } from "@/components/navigation/top-nav";
import { prisma } from "@/lib/prisma";
import {
  SubscriptionsListView,
  SubscriptionItem,
  CustomerOption,
} from "@/components/subscriptions/subscriptions-list-view";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const [subscriptions, customers] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        quotation: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, tier: true },
    }),
  ]);

  const formattedSubscriptions: SubscriptionItem[] = subscriptions.map((s) => ({
    id: s.id,
    customerId: s.customerId,
    customerName: s.customer.name,
    customerTier: s.customer.tier,
    planName: s.planName,
    cycle: s.cycle,
    pricePerCycle: Number(s.pricePerCycle),
    nextBillDate: s.nextBillDate ? s.nextBillDate.toLocaleDateString() : null,
    status: s.status as "ACTIVE" | "PAUSED" | "CANCELLED",
    originatingQuoteCode: s.quotation?.displayCode,
    createdAt: s.createdAt.toLocaleDateString(),
  }));

  const customerOptions: CustomerOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    tier: c.tier,
  }));

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionsListView
          initialSubscriptions={formattedSubscriptions}
          customers={customerOptions}
        />
      </main>
    </div>
  );
}
