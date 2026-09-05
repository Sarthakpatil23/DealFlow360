"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  SubscriptionStatus,
  RecurringCycle,
  InvoiceType,
  InvoiceStatus,
} from "@prisma/client";
import {
  calculateProrationCharge,
  calculateCancellationCredit,
} from "@/lib/business-logic/proration";
import { generateNextInvoiceCode } from "@/app/actions/quotation-actions";

/**
 * Modifies an existing subscription price/plan with live proration charge.
 * Step 23 & 24.
 */
export async function modifySubscriptionAction(
  subscriptionId: string,
  newPrice: number,
  notes?: string
): Promise<{
  success: boolean;
  proratedInvoiceCode?: string;
  proratedCharge?: number;
  message?: string;
  error?: string;
}> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { customer: true },
    });

    if (!sub) {
      return { success: false, error: "Subscription not found" };
    }

    const oldPrice = Number(sub.pricePerCycle);
    if (newPrice <= 0) {
      return { success: false, error: "Price must be greater than 0" };
    }

    // Determine cycle length in days
    const totalDays =
      sub.cycle === RecurringCycle.YEARLY
        ? 365
        : sub.cycle === RecurringCycle.QUARTERLY
        ? 90
        : 30;

    // Calculate days remaining until next bill date
    let daysRemaining = Math.floor(totalDays / 2); // Default mid-cycle 15 days if not set
    if (sub.nextBillDate) {
      const msDiff = sub.nextBillDate.getTime() - Date.now();
      const calculatedDays = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (calculatedDays > 0 && calculatedDays <= totalDays) {
        daysRemaining = calculatedDays;
      }
    }

    const proration = calculateProrationCharge(
      oldPrice,
      newPrice,
      totalDays,
      daysRemaining
    );

    // Update the subscription's ongoing price
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        pricePerCycle: newPrice,
      },
    });

    // If upgrading (newPrice > oldPrice), generate a prorated delta invoice
    let invoiceCode: string | undefined;
    if (proration.proratedCharge > 0) {
      invoiceCode = await generateNextInvoiceCode();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

      await prisma.invoice.create({
        data: {
          displayCode: invoiceCode,
          customerId: sub.customerId,
          subscriptionId: sub.id,
          quotationId: sub.quotationId,
          type: InvoiceType.RECURRING,
          amount: proration.proratedCharge,
          status: InvoiceStatus.UNPAID,
          dueDate: dueDate,
        },
      });
    }

    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
      proratedInvoiceCode: invoiceCode,
      proratedCharge: proration.proratedCharge,
      message:
        proration.proratedCharge > 0
          ? `Plan modified! Prorated delta charge of $${proration.proratedCharge.toFixed(2)} invoiced (${invoiceCode}). Next cycle will bill $${newPrice.toFixed(2)}.`
          : `Plan updated to $${newPrice.toFixed(2)}/cycle.`,
    };
  } catch (err: any) {
    console.error("Error modifying subscription:", err);
    return { success: false, error: err.message || "Failed to modify subscription" };
  }
}

/**
 * Cancels a subscription and automatically creates a CreditNote for unused days.
 * Step 24.
 */
export async function cancelSubscriptionAction(
  subscriptionId: string,
  reason: string = "Customer requested cancellation"
): Promise<{
  success: boolean;
  creditNoteId?: string;
  creditAmount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { customer: true },
    });

    if (!sub) {
      return { success: false, error: "Subscription not found" };
    }

    if (sub.status === SubscriptionStatus.CANCELLED) {
      return { success: false, error: "Subscription is already cancelled" };
    }

    const currentPrice = Number(sub.pricePerCycle);
    const totalDays =
      sub.cycle === RecurringCycle.YEARLY
        ? 365
        : sub.cycle === RecurringCycle.QUARTERLY
        ? 90
        : 30;

    let daysRemaining = 15; // default mid-cycle
    if (sub.nextBillDate) {
      const msDiff = sub.nextBillDate.getTime() - Date.now();
      const calcDays = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (calcDays > 0 && calcDays <= totalDays) {
        daysRemaining = calcDays;
      }
    }

    const refundCredit = calculateCancellationCredit(
      currentPrice,
      totalDays,
      daysRemaining
    );

    // Cancel the subscription and clear next bill date
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        nextBillDate: null,
      },
    });

    // Create CreditNote in Prisma
    let createdCreditNote;
    if (refundCredit.creditAmount > 0) {
      createdCreditNote = await prisma.creditNote.create({
        data: {
          customerId: sub.customerId,
          subscriptionId: sub.id,
          amount: refundCredit.creditAmount,
          reason: `Unused subscription credit (${refundCredit.daysRemaining}/${totalDays} days): ${reason}`,
        },
      });
    }

    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
      creditNoteId: createdCreditNote?.id,
      creditAmount: refundCredit.creditAmount,
      message:
        refundCredit.creditAmount > 0
          ? `Subscription cancelled. Generated Credit Note of $${refundCredit.creditAmount.toFixed(2)} for ${refundCredit.daysRemaining} unused days.`
          : "Subscription cancelled successfully. No future billing.",
    };
  } catch (err: any) {
    console.error("Error cancelling subscription:", err);
    return { success: false, error: err.message || "Failed to cancel subscription" };
  }
}

/**
 * Toggles subscription between ACTIVE and PAUSED.
 */
export async function togglePauseSubscriptionAction(
  subscriptionId: string
): Promise<{ success: boolean; newStatus?: string; message?: string; error?: string }> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      return { success: false, error: "Subscription not found" };
    }

    if (sub.status === SubscriptionStatus.CANCELLED) {
      return { success: false, error: "Cannot pause a cancelled subscription" };
    }

    const isPausing = sub.status === SubscriptionStatus.ACTIVE;
    const newStatus = isPausing ? SubscriptionStatus.PAUSED : SubscriptionStatus.ACTIVE;

    let nextBillDate: Date | null = null;
    if (!isPausing) {
      // Resuming: set next bill date 30 days from now
      nextBillDate = new Date();
      nextBillDate.setDate(nextBillDate.getDate() + 30);
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: newStatus,
        nextBillDate: isPausing ? null : nextBillDate,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      newStatus,
      message: isPausing
        ? "Subscription paused. Future billing suspended."
        : "Subscription resumed. Next bill scheduled.",
    };
  } catch (err: any) {
    console.error("Error pausing/resuming subscription:", err);
    return { success: false, error: err.message || "Failed to update status" };
  }
}

/**
 * Creates a new manual subscription plan (Admin feature, Step 24).
 */
export async function createManualSubscriptionAction(data: {
  customerId: string;
  planName: string;
  cycle: RecurringCycle;
  pricePerCycle: number;
}): Promise<{ success: boolean; subscriptionId?: string; message?: string; error?: string }> {
  try {
    if (!data.customerId || !data.planName || data.pricePerCycle <= 0) {
      return { success: false, error: "Please provide valid customer, plan name and price" };
    }

    const cycleDays =
      data.cycle === RecurringCycle.YEARLY
        ? 365
        : data.cycle === RecurringCycle.QUARTERLY
        ? 90
        : 30;

    const nextBill = new Date();
    nextBill.setDate(nextBill.getDate() + cycleDays);

    const sub = await prisma.subscription.create({
      data: {
        customerId: data.customerId,
        planName: data.planName,
        cycle: data.cycle,
        pricePerCycle: data.pricePerCycle,
        nextBillDate: nextBill,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Create initial invoice
    const invCode = await generateNextInvoiceCode();
    await prisma.invoice.create({
      data: {
        displayCode: invCode,
        customerId: data.customerId,
        subscriptionId: sub.id,
        type: InvoiceType.RECURRING,
        amount: data.pricePerCycle,
        status: InvoiceStatus.UNPAID,
        dueDate: nextBill,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
      subscriptionId: sub.id,
      message: `Created subscription "${data.planName}" ($${data.pricePerCycle.toFixed(2)}/${data.cycle.toLowerCase()}).`,
    };
  } catch (err: any) {
    console.error("Error creating manual subscription:", err);
    return { success: false, error: err.message || "Failed to create subscription" };
  }
}
