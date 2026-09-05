import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CustomerPortalNav } from "@/components/portal/customer-portal-nav";
import {
  CustomerNegotiationView,
  PortalQuotationData,
  PortalOrderLine,
  PortalCommentItem,
  PortalFulfillmentData,
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

  // Load quotation with customer, lines, fulfillment and comments
  const q = await prisma.quotation.findFirst({
    where: {
      OR: [{ id: params.id }, { displayCode: params.id }],
    },
    include: {
      customer: true,
      orderLines: {
        include: { product: true },
      },
      fulfillment: {
        include: {
          lines: {
            include: {
              warehouse: true,
              product: true,
            },
          },
        },
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
        <div className="max-w-md p-6 bg-card border border-border rounded-2xl text-center space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-destructive">Access Restricted</h2>
          <p className="text-xs text-muted-foreground">
            You do not have permission to view quotations from other customer organizations.
          </p>
        </div>
      </div>
    );
  }

  let totalGross = 0;
  let totalDiscount = 0;
  let totalUnitsOrdered = 0;

  const orderLines: PortalOrderLine[] = q.orderLines.map((l) => {
    const gross = Number(l.unitPrice) * l.quantity;
    const disc = gross * (Number(l.discountPercent) / 100);
    totalGross += gross;
    totalDiscount += disc;
    totalUnitsOrdered += l.quantity;

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

  // Build Fulfillment Details
  let fulfillmentData: PortalFulfillmentData | null = null;
  if (q.fulfillment) {
    const isFullyFulfilled = q.fulfillment.status === "FULFILLED";
    const fulfillmentLines = q.fulfillment.lines || [];

    const totalUnitsShipped = fulfillmentLines.reduce((sum, fl) => {
      return sum + (fl.shippedAt || isFullyFulfilled ? fl.quantityFulfilled : 0);
    }, 0);

    let deliveryStatus: "FULLY_DELIVERED" | "PARTIALLY_SHIPPED" | "IN_FULFILLMENT" | "PENDING" =
      "PENDING";

    if (isFullyFulfilled || (totalUnitsOrdered > 0 && totalUnitsShipped >= totalUnitsOrdered)) {
      deliveryStatus = "FULLY_DELIVERED";
    } else if (totalUnitsShipped > 0) {
      deliveryStatus = "PARTIALLY_SHIPPED";
    } else {
      deliveryStatus = "IN_FULFILLMENT";
    }

    fulfillmentData = {
      status: q.fulfillment.status,
      totalUnitsOrdered,
      totalUnitsShipped,
      deliveryStatus,
      lines: fulfillmentLines.map((fl) => ({
        warehouseName: fl.warehouse.name,
        units: fl.quantityFulfilled,
        isBackordered: fl.isBackordered,
        shippedAt: fl.shippedAt ? fl.shippedAt.toLocaleDateString() : null,
        status: fl.shippedAt
          ? "Shipped"
          : fl.isBackordered
          ? "Backordered"
          : "Stock Allocated",
      })),
    };
  }

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
    fulfillment: fulfillmentData,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-150">
      {/* Clean Customer-Dedicated Navigation (NO internal staff TopNav!) */}
      <CustomerPortalNav
        customerName={q.customer.name}
        customerTier={q.customer.tier}
        userEmail={session.user.email || undefined}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerNegotiationView initialData={portalData} />
      </main>
    </div>
  );
}
