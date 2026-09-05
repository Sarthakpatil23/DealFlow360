"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { DealHealthAlertAction, DealHealthAlertType, AuditAction } from "@prisma/client";

/**
 * Step 29: Nudges the Sales Rep responsible for an idle or stalled quote.
 */
export async function nudgeRepAction(
  quotationId: string,
  alertId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    const q = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { ownerRep: true },
    });

    if (!q) {
      return { success: false, error: "Quotation not found." };
    }

    if (alertId) {
      await prisma.dealHealthAlert.update({
        where: { id: alertId },
        data: {
          actionTaken: DealHealthAlertAction.NUDGE_SENT,
          actionTakenAt: new Date(),
        },
      });
    } else {
      await prisma.dealHealthAlert.create({
        data: {
          quotationId: q.id,
          type: DealHealthAlertType.STALLED,
          issueDescription: "Idle deal with zero recent activity.",
          actionTaken: DealHealthAlertAction.NUDGE_SENT,
          actionTakenAt: new Date(),
        },
      });
    }

    // Log in immutable audit trail
    await prisma.auditLogEntry.create({
      data: {
        quotationId: q.id,
        actorUserId: session?.user?.id || q.ownerRepId,
        action: AuditAction.CONFIG_CHANGED,
        note: `Manager sent nudge reminder to ${q.ownerRep.name} regarding idle quote progress.`,
      },
    });

    revalidatePath("/deal-health");
    revalidatePath("/dashboard");
    revalidatePath(`/quotations/${q.id}`);

    return {
      success: true,
      message: `Nudge reminder successfully sent to ${q.ownerRep.name}!`,
    };
  } catch (err: any) {
    console.error("Error nudging rep:", err);
    return { success: false, error: err.message || "Failed to send nudge." };
  }
}

/**
 * Step 29: Escalates a deal health alert directly to the Sales Manager.
 */
export async function escalateDealAction(
  quotationId: string,
  alertId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    const q = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { ownerRep: true },
    });

    if (!q) {
      return { success: false, error: "Quotation not found." };
    }

    if (alertId) {
      await prisma.dealHealthAlert.update({
        where: { id: alertId },
        data: {
          actionTaken: DealHealthAlertAction.ESCALATED,
          actionTakenAt: new Date(),
        },
      });
    } else {
      await prisma.dealHealthAlert.create({
        data: {
          quotationId: q.id,
          type: DealHealthAlertType.DISCOUNT_ANOMALY,
          issueDescription: "Unusual discount profile flagged by Deal Health check.",
          actionTaken: DealHealthAlertAction.ESCALATED,
          actionTakenAt: new Date(),
        },
      });
    }

    // Log in immutable audit trail
    await prisma.auditLogEntry.create({
      data: {
        quotationId: q.id,
        actorUserId: session?.user?.id || q.ownerRepId,
        action: AuditAction.CONFIG_CHANGED,
        note: `Deal escalated to Sales Manager for priority risk intervention.`,
      },
    });

    revalidatePath("/deal-health");
    revalidatePath("/dashboard");
    revalidatePath(`/quotations/${q.id}`);

    return {
      success: true,
      message: `Deal ${q.displayCode} escalated to Sales Manager!`,
    };
  } catch (err: any) {
    console.error("Error escalating deal:", err);
    return { success: false, error: err.message || "Failed to escalate deal." };
  }
}
