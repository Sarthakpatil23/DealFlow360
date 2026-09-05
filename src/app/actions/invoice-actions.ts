"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, InvoiceType, FulfillmentStatus } from "@prisma/client";
import { generateNextInvoiceCode } from "@/app/actions/quotation-actions";

/**
 * Step 26: Records payment on an invoice.
 * Updates invoice status to PAID, timestamps paidAt.
 */
export async function recordInvoicePaymentAction(
  invoiceIdOrCode: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: invoiceIdOrCode }, { displayCode: invoiceIdOrCode }],
      },
      include: {
        customer: true,
        quotation: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return { success: false, error: "Invoice is already marked as Paid." };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    try {
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoice.id}`);
      revalidatePath(`/invoices/${invoice.displayCode}`);
      revalidatePath("/subscriptions");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      message: `Payment of $${Number(invoice.amount).toFixed(2)} recorded for ${invoice.displayCode}!`,
    };
  } catch (err: any) {
    console.error("Error recording payment:", err);
    return { success: false, error: err.message || "Failed to record payment." };
  }
}

/**
 * Step 25: Generates a One-Time Invoice strictly for shipped physical lines.
 * Reconciles partial delivery with partial invoicing:
 * "Nothing is billed before it ships."
 */
export async function shipAndInvoiceFulfillmentAction(
  fulfillmentId: string,
  targetWarehouseId?: string
): Promise<{
  success: boolean;
  invoiceCode?: string;
  shippedUnits?: number;
  invoicedAmount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: {
        quotation: {
          include: {
            orderLines: {
              include: { product: true },
            },
          },
        },
        lines: {
          include: {
            warehouse: true,
            product: true,
          },
        },
      },
    });

    if (!fulfillment) {
      return { success: false, error: "Fulfillment record not found." };
    }

    // Identify non-backordered fulfillment lines that haven't shipped yet
    const linesToShip = fulfillment.lines.filter(
      (l) => !l.isBackordered && (!targetWarehouseId || l.warehouseId === targetWarehouseId) && !l.shippedAt
    );

    if (linesToShip.length === 0) {
      return {
        success: false,
        error: "All allocated units for this warehouse have already been shipped and invoiced.",
      };
    }

    let totalShippedUnits = 0;
    let totalInvoicedAmount = 0;

    // Mark lines as shipped and calculate proportional order value
    for (const fl of linesToShip) {
      fl.shippedAt = new Date();
      await prisma.fulfillmentLine.update({
        where: { id: fl.id },
        data: { shippedAt: new Date() },
      });

      totalShippedUnits += fl.quantityFulfilled;

      // Find the corresponding orderLine to get accurate unit price and discount
      const orderLine = fulfillment.quotation.orderLines.find(
        (ol) => ol.productId === fl.productId
      );

      if (orderLine) {
        const netUnitPrice =
          Number(orderLine.unitPrice) * (1 - Number(orderLine.discountPercent) / 100);
        totalInvoicedAmount += netUnitPrice * fl.quantityFulfilled;
      } else {
        totalInvoicedAmount += Number(fl.estimatedCost || 0);
      }
    }

    // Also include one-time services (like Onsite Setup) on the first shipment invoice
    const serviceLines = fulfillment.quotation.orderLines.filter(
      (ol) => ol.product.category === "SERVICES" && !ol.product.isSubscription
    );

    // Check if services were already invoiced
    const existingInvoices = await prisma.invoice.findMany({
      where: { quotationId: fulfillment.quotationId, type: InvoiceType.ONE_TIME },
    });

    if (existingInvoices.length === 0) {
      for (const sl of serviceLines) {
        const netService =
          Number(sl.unitPrice) * (1 - Number(sl.discountPercent) / 100) * sl.quantity;
        totalInvoicedAmount += netService;
      }
    }

    totalInvoicedAmount = Number(totalInvoicedAmount.toFixed(2));

    // Generate Invoice
    const invoiceCode = await generateNextInvoiceCode();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Net 14 payment terms

    await prisma.invoice.create({
      data: {
        displayCode: invoiceCode,
        customerId: fulfillment.quotation.customerId,
        quotationId: fulfillment.quotationId,
        type: InvoiceType.ONE_TIME,
        amount: totalInvoicedAmount,
        status: InvoiceStatus.UNPAID,
        dueDate: dueDate,
      },
    });

    // Update fulfillment status if everything is now shipped
    const allLines = await prisma.fulfillmentLine.findMany({
      where: { fulfillmentId },
    });

    const hasUnshipped = allLines.some((l) => !l.shippedAt);
    if (!hasUnshipped) {
      await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: { status: FulfillmentStatus.FULFILLED },
      });
    }

    try {
      revalidatePath(`/fulfillment/${fulfillmentId}`);
      revalidatePath("/fulfillment");
      revalidatePath("/invoices");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      invoiceCode,
      shippedUnits: totalShippedUnits,
      invoicedAmount: totalInvoicedAmount,
      message: `Shipped ${totalShippedUnits} units! Generated partial delivery invoice ${invoiceCode} for $${totalInvoicedAmount.toFixed(2)}.`,
    };
  } catch (err: any) {
    console.error("Error shipping and invoicing fulfillment:", err);
    return { success: false, error: err.message || "Failed to process shipment and invoice." };
  }
}
