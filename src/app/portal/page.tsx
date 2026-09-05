import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CustomerPortalDashboard,
  CustomerOrderInfo,
  CustomerQuoteInfo,
  CustomerInvoiceInfo,
  CustomerSubscriptionInfo,
  CustomerCreditNoteInfo,
  CustomerOrderLineInfo,
} from "@/components/portal/customer-portal-dashboard";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Internal users (REP, MANAGER, FINANCE, ADMIN) belong to the Sales Dashboard
  if (session.user.role !== "CUSTOMER") {
    redirect("/dashboard");
  }

  // Look up customer details strictly scoped to customerId
  if (!session.user.customerId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
        <div className="max-w-md p-6 bg-card border border-border rounded-2xl text-center space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-destructive">Account Misconfigured</h2>
          <p className="text-xs text-muted-foreground">
            No customer organization ID is linked to your portal login. Please contact your account manager.
          </p>
        </div>
      </div>
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.customerId },
    include: {
      quotations: {
        orderBy: { createdAt: "desc" },
        include: {
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
          invoices: {
            orderBy: { dueDate: "desc" },
          },
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { dueDate: "desc" },
      },
      creditNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
        <div className="max-w-md p-6 bg-card border border-border rounded-2xl text-center space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-destructive">Customer Record Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The customer organization for this user account could not be found in the database.
          </p>
        </div>
      </div>
    );
  }

  // Split quotes into Confirmed Orders vs Open Proposals
  const confirmedQuotes = customer.quotations.filter((q) => q.stage === "CONFIRMED");
  const proposalQuotes = customer.quotations.filter((q) => q.stage !== "CONFIRMED");

  // Transform Confirmed Quotes into Rich Customer Orders
  const orders: CustomerOrderInfo[] = confirmedQuotes.map((q) => {
    let totalGross = 0;
    let totalDiscount = 0;
    let totalUnitsOrdered = 0;
    let totalUnitsShipped = 0;

    const fulfillmentLines = q.fulfillment?.lines || [];
    const isFullyFulfilled = q.fulfillment?.status === "FULFILLED";

    const lines: CustomerOrderLineInfo[] = q.orderLines.map((line) => {
      const gross = Number(line.unitPrice) * line.quantity;
      const disc = gross * (Number(line.discountPercent) / 100);
      const lineTotal = gross - disc;
      totalGross += gross;
      totalDiscount += disc;
      totalUnitsOrdered += line.quantity;

      // Find matching fulfillment lines for this line's product
      const matchedFulfillment = fulfillmentLines.filter(
        (fl) => fl.productId === line.productId
      );

      let lineShipped = 0;
      let lineBackordered = 0;
      const warehouseNames: string[] = [];
      let latestShippedAt: string | null = null;

      if (isFullyFulfilled) {
        lineShipped = line.quantity;
      } else if (matchedFulfillment.length > 0) {
        matchedFulfillment.forEach((fl) => {
          if (fl.shippedAt || isFullyFulfilled) {
            lineShipped += fl.quantityFulfilled;
            if (fl.shippedAt) {
              latestShippedAt = fl.shippedAt.toLocaleDateString();
            }
          }
          if (fl.isBackordered) {
            lineBackordered += fl.quantityFulfilled;
          }
          if (fl.warehouse?.name && !warehouseNames.includes(fl.warehouse.name)) {
            warehouseNames.push(fl.warehouse.name);
          }
        });
      }

      totalUnitsShipped += Math.min(line.quantity, lineShipped);

      let shipmentStatus: "DELIVERED" | "SHIPPED" | "PROCESSING" | "BACKORDER" = "PROCESSING";
      if (lineShipped >= line.quantity) {
        shipmentStatus = "DELIVERED";
      } else if (lineShipped > 0) {
        shipmentStatus = "SHIPPED";
      } else if (lineBackordered > 0) {
        shipmentStatus = "BACKORDER";
      } else if (q.fulfillment) {
        shipmentStatus = "PROCESSING";
      }

      return {
        id: line.id,
        productName: line.product.name,
        category: line.product.category,
        quantityOrdered: line.quantity,
        quantityShipped: lineShipped,
        quantityBackordered: lineBackordered,
        unitPrice: Number(line.unitPrice),
        discountPercent: Number(line.discountPercent),
        lineTotal,
        shipmentStatus,
        warehouseName: warehouseNames.join(", ") || "Regional Fulfillment Center",
        shippedAt: latestShippedAt,
      };
    });

    // Determine Overall Order Delivery Status
    let deliveryStatus: "FULLY_DELIVERED" | "PARTIALLY_SHIPPED" | "IN_FULFILLMENT" | "PENDING" =
      "PENDING";

    if (isFullyFulfilled || (totalUnitsOrdered > 0 && totalUnitsShipped >= totalUnitsOrdered)) {
      deliveryStatus = "FULLY_DELIVERED";
    } else if (totalUnitsShipped > 0) {
      deliveryStatus = "PARTIALLY_SHIPPED";
    } else if (q.fulfillment) {
      deliveryStatus = "IN_FULFILLMENT";
    }

    // Shipments summary per warehouse
    const shipments = fulfillmentLines.map((fl) => ({
      warehouseName: fl.warehouse?.name || "Distribution Center",
      units: fl.quantityFulfilled,
      isBackordered: fl.isBackordered,
      shippedAt: fl.shippedAt ? fl.shippedAt.toLocaleDateString() : null,
      status: fl.shippedAt
        ? "Dispatched & In Transit"
        : fl.isBackordered
        ? "Backordered - Awaiting Stock"
        : "Stock Allocated - Packing",
    }));

    // Attached Invoices for this Order
    const attachedInvoices = (q.invoices || []).map((inv) => ({
      displayCode: inv.displayCode,
      type: inv.type,
      amount: Number(inv.amount),
      status: inv.status,
      dueDate: inv.dueDate.toLocaleDateString(),
    }));

    return {
      id: q.id,
      displayCode: q.displayCode,
      stage: q.stage,
      createdAt: q.createdAt.toLocaleDateString(),
      totalValue: totalGross - totalDiscount,
      totalUnitsOrdered,
      totalUnitsShipped,
      deliveryStatus,
      lines,
      shipments,
      invoices: attachedInvoices,
    };
  });

  // Transform Proposals
  const proposals: CustomerQuoteInfo[] = proposalQuotes.map((q) => {
    let total = 0;
    const lines = q.orderLines.map((line) => {
      const gross = Number(line.unitPrice) * line.quantity;
      const disc = gross * (Number(line.discountPercent) / 100);
      const lineTotal = gross - disc;
      total += lineTotal;
      return {
        productName: line.product.name,
        quantity: line.quantity,
        discountPercent: Number(line.discountPercent),
        lineTotal,
      };
    });

    return {
      id: q.id,
      displayCode: q.displayCode,
      stage: q.stage,
      createdAt: q.createdAt.toLocaleDateString(),
      totalValue: total,
      itemCount: q.orderLines.length,
      lines,
    };
  });

  // Transform Invoices
  const invoices: CustomerInvoiceInfo[] = customer.invoices.map((inv) => ({
    id: inv.id,
    displayCode: inv.displayCode,
    type: inv.type,
    amount: Number(inv.amount),
    status: inv.status,
    dueDate: inv.dueDate.toLocaleDateString(),
    paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString() : null,
  }));

  // Transform Subscriptions
  const subscriptions: CustomerSubscriptionInfo[] = customer.subscriptions.map((sub) => ({
    id: sub.id,
    planName: sub.planName,
    cycle: sub.cycle,
    pricePerCycle: Number(sub.pricePerCycle),
    nextBillDate: sub.nextBillDate ? sub.nextBillDate.toLocaleDateString() : null,
    status: sub.status,
  }));

  // Transform Credit Notes
  const creditNotes: CustomerCreditNoteInfo[] = customer.creditNotes.map((cn) => ({
    id: cn.id,
    amount: Number(cn.amount),
    reason: cn.reason,
    createdAt: cn.createdAt.toLocaleDateString(),
  }));

  return (
    <CustomerPortalDashboard
      customer={{
        id: customer.id,
        name: customer.name,
        tier: customer.tier,
        currency: customer.preferredCurrency,
        userEmail: session.user.email || "customer@portal.com",
      }}
      orders={orders}
      proposals={proposals}
      invoices={invoices}
      subscriptions={subscriptions}
      creditNotes={creditNotes}
    />
  );
}
