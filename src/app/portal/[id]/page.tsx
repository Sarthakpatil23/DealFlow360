import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/navigation/top-nav";
import {
  CustomerNegotiationView,
  PortalQuotationData,
  PortalOrderLine,
  PortalCommentItem,
} from "@/components/portal/customer-negotiation-view";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function PortalQuotationPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Load quotation
  const q = await prisma.quotation.findFirst({
    where: {
      OR: [{ id: params.id }, { displayCode: params.id }],
    },
    include: {
      customer: true,
      orderLines: {
        include: { product: true },
      },
      negotiationComments: {
        orderBy: { createdAt: "desc" },
        include: {
          authorUser: true,
          authorCustomerUser: true,
          orderLine: { include: { product: true } },
        },
      },
    },
  });

  if (!q) {
    return notFound();
  }

  // Step 27 Security Check: If user is CUSTOMER, ensure they own this quotation
  if (session.user.role === "CUSTOMER" && session.user.customerId && q.customerId !== session.user.customerId) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-600">Access Restricted</h2>
          <p className="text-xs text-neutral-500">
            You do not have permission to view quotations from other customer organizations.
          </p>
        </div>
      </div>
    );
  }

  let totalGross = 0;
  let totalDiscount = 0;

  const orderLines: PortalOrderLine[] = q.orderLines.map((l) => {
    const gross = Number(l.unitPrice) * l.quantity;
    const disc = gross * (Number(l.discountPercent) / 100);
    totalGross += gross;
    totalDiscount += disc;

    return {
      id: l.id,
      productName: l.product.name,
      category: l.product.category,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      discountPercent: Number(l.discountPercent),
      amount: gross - disc,
    };
  });

  const comments: PortalCommentItem[] = q.negotiationComments.map((c) => ({
    id: c.id,
    productName: c.orderLine?.product.name,
    commentText: c.commentText,
    counterDiscountPercent: c.counterDiscountPercent ? Number(c.counterDiscountPercent) : null,
    authorName: c.authorUser?.name || c.authorCustomerUser?.email || "Customer",
    createdAt: c.createdAt.toLocaleDateString(),
  }));

  const portalData: PortalQuotationData = {
    id: q.id,
    displayCode: q.displayCode,
    customerId: q.customerId,
    customerName: q.customer.name,
    customerTier: q.customer.tier,
    stage: q.stage,
    totalGross,
    totalDiscount,
    totalNet: totalGross - totalDiscount,
    orderLines,
    comments,
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerNegotiationView initialData={portalData} />
      </main>
    </div>
  );
}
