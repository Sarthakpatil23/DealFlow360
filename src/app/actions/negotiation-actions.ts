"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { QuotationStage, AuditAction } from "@prisma/client";

export interface LineNegotiationInput {
  orderLineId?: string;
  commentText: string;
  counterDiscountPercent?: number;
}

/**
 * Step 27: Customer submits negotiation comments and counter-discount proposals.
 * Sets quotation stage to NEGOTIATION and appends NegotiationComment entries.
 */
export async function submitNegotiationRequestAction(
  quotationId: string,
  comments: LineNegotiationInput[],
  requestedDeliveryDate?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    const q = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });

    if (!q) {
      return { success: false, error: "Quotation not found." };
    }

    const deliveryDate = requestedDeliveryDate ? new Date(requestedDeliveryDate) : null;

    // Filter non-empty comments
    const validComments = comments.filter((c) => c.commentText?.trim() || (c.counterDiscountPercent !== undefined && !isNaN(c.counterDiscountPercent)));

    if (validComments.length === 0 && !deliveryDate) {
      return { success: false, error: "Please enter at least one comment or counter-discount." };
    }

    // Create negotiation comment records
    for (const c of validComments) {
      await prisma.negotiationComment.create({
        data: {
          quotationId: q.id,
          orderLineId: c.orderLineId || null,
          authorCustomerUserId: session?.user?.id || null,
          commentText: c.commentText?.trim() || "Proposed counter discount.",
          counterDiscountPercent:
            c.counterDiscountPercent !== undefined && !isNaN(c.counterDiscountPercent)
              ? c.counterDiscountPercent
              : null,
          requestedDeliveryDate: deliveryDate,
        },
      });
    }

    // Update quote stage to NEGOTIATION
    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        stage: QuotationStage.NEGOTIATION,
        lastActivityAt: new Date(),
      },
    });

    // Immutable Audit Trail
    await prisma.auditLogEntry.create({
      data: {
        quotationId: q.id,
        actorUserId: q.ownerRepId,
        action: AuditAction.CONFIG_CHANGED,
        note: `Customer submitted negotiation request: ${validComments.length} comment(s)/counter-proposal(s).`,
      },
    });

    try {
      revalidatePath(`/portal`);
      revalidatePath(`/portal/${q.id}`);
      revalidatePath(`/quotations/${q.id}`);
      revalidatePath(`/quotations/${q.displayCode}`);
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      message: "Negotiation request sent to sales rep successfully! Quote is now Under Negotiation.",
    };
  } catch (err: any) {
    console.error("Error submitting negotiation request:", err);
    return { success: false, error: err.message || "Failed to submit request." };
  }
}
