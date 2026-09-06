"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  QuotationStage,
  ApprovalStepStatus,
  ApprovalStepRole,
  AuditAction,
} from "@prisma/client";

export interface ApprovalActionResult {
  success: boolean;
  stage?: string;
  isFinalApproval?: boolean;
  message?: string;
  error?: string;
}

/**
 * Helper to get current actor user from session or fallback approver.
 */
async function getActorUser() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (dbUser) return dbUser;
    }
  } catch {}

  // Fallback to Manager if not in authenticated context
  return (
    (await prisma.user.findFirst({ where: { role: "MANAGER" } })) ||
    (await prisma.user.findFirst())
  );
}

/**
 * Approves the current step of a quotation (Screen 6).
 * If mid-chain (Sales Manager approving HIGH risk), advances to Finance.
 * If final step, advances Quotation to APPROVED!
 */
export async function approveQuotationAction(
  quotationId: string,
  note?: string
): Promise<ApprovalActionResult> {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return { success: false, error: "Authenticated approver user not found." };
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        approvalSteps: {
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    if (!quotation) {
      return { success: false, error: "Quotation not found." };
    }

    if (quotation.stage !== QuotationStage.PENDING_APPROVAL) {
      return { success: false, error: `Quotation is in ${quotation.stage} stage and cannot be approved.` };
    }

    // Find the current pending step
    const pendingStep = quotation.approvalSteps.find(
      (s) => s.status === ApprovalStepStatus.PENDING
    );

    if (actor.role === "REP") {
      return {
        success: false,
        error: "Unauthorized: Sales Representatives are not permitted to approve quotations. Approvals must be performed by the designated Manager or Finance authority.",
      };
    }

    if (pendingStep) {
      if (
        pendingStep.requiredRole === ApprovalStepRole.SALES_MANAGER &&
        actor.role !== "MANAGER" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Sales Manager role.",
        };
      }
      if (
        pendingStep.requiredRole === ApprovalStepRole.FINANCE &&
        actor.role !== "FINANCE" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Finance role.",
        };
      }
    }

    if (!pendingStep) {
      // If no steps pending, mark quotation directly approved
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { stage: QuotationStage.APPROVED, lastActivityAt: new Date() },
      });
      return { success: true, message: `Quotation ${quotation.displayCode} marked as Approved.` };
    }

    // Mark active step as APPROVED
    await prisma.approvalStep.update({
      where: { id: pendingStep.id },
      data: {
        status: ApprovalStepStatus.APPROVED,
        actedByUserId: actor.id,
        actedAt: new Date(),
        note: note || undefined,
      },
    });

    // Check if there are remaining pending steps
    const remainingSteps = quotation.approvalSteps.filter(
      (s) => s.id !== pendingStep.id && s.status === ApprovalStepStatus.PENDING
    );

    const isFinalApproval = remainingSteps.length === 0;

    if (isFinalApproval) {
      // Final approval: quote moves to APPROVED stage
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          stage: QuotationStage.APPROVED,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditLogEntry.create({
        data: {
          quotationId,
          actorUserId: actor.id,
          action: AuditAction.APPROVED,
          note: note ? `${actor.name} approved: ${note}` : `${actor.name} approved quotation (Final).`,
        },
      });
    } else {
      // Mid-chain: Sales Manager approved HIGH risk, now passed to Finance for final signoff
      const nextRole = remainingSteps[0].requiredRole;
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { lastActivityAt: new Date() },
      });

      await prisma.auditLogEntry.create({
        data: {
          quotationId,
          actorUserId: actor.id,
          action: AuditAction.APPROVED,
          note: note
            ? `${actor.name} endorsed quotation: ${note}. Passed to ${nextRole} queue for final approval.`
            : `${actor.name} endorsed quotation. Passed to ${nextRole} queue for final commercial approval.`,
        },
      });
    }

    try {
      revalidatePath(`/approvals/${quotationId}`);
      revalidatePath(`/approvals/${quotation.displayCode}`);
      revalidatePath("/approvals");
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      stage: isFinalApproval ? QuotationStage.APPROVED : QuotationStage.PENDING_APPROVAL,
      isFinalApproval,
      message: isFinalApproval
        ? `Quotation ${quotation.displayCode} approved! Ready for customer review & fulfillment.`
        : `Quotation endorsed by ${actor.name} and passed to Finance (R. Iyer) for final approval.`,
    };
  } catch (error: any) {
    console.error("Failed to approve quotation:", error);
    return { success: false, error: error.message || "Failed to approve quotation." };
  }
}

/**
 * Returns quotation to rep for revision with mandatory reason note (Screen 6).
 */
export async function returnQuotationAction(
  quotationId: string,
  reason: string
): Promise<ApprovalActionResult> {
  try {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: "A justification note is required to return a quotation." };
    }

    const actor = await getActorUser();
    if (!actor) {
      return { success: false, error: "Authenticated user not found." };
    }

    if (actor.role === "REP") {
      return {
        success: false,
        error: "Unauthorized: Sales Representatives are not permitted to return quotations. This action is restricted to designated approvers.",
      };
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { approvalSteps: true },
    });

    if (!quotation) {
      return { success: false, error: "Quotation not found." };
    }

    // Find pending step
    const pendingStep = quotation.approvalSteps.find(
      (s) => s.status === ApprovalStepStatus.PENDING
    );

    if (pendingStep) {
      if (
        pendingStep.requiredRole === ApprovalStepRole.SALES_MANAGER &&
        actor.role !== "MANAGER" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Sales Manager role.",
        };
      }
      if (
        pendingStep.requiredRole === ApprovalStepRole.FINANCE &&
        actor.role !== "FINANCE" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Finance role.",
        };
      }

      await prisma.approvalStep.update({
        where: { id: pendingStep.id },
        data: {
          status: ApprovalStepStatus.RETURNED,
          actedByUserId: actor.id,
          actedAt: new Date(),
          note: trimmedReason,
        },
      });
    }

    // Quote moves back to Draft stage, editable again by sales rep
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        stage: QuotationStage.DRAFT,
        lastActivityAt: new Date(),
      },
    });

    // Log Return into Audit Trail
    await prisma.auditLogEntry.create({
      data: {
        quotationId,
        actorUserId: actor.id,
        action: AuditAction.RETURNED_FOR_REVISION,
        note: `${actor.name} returned for revision: "${trimmedReason}"`,
      },
    });

    try {
      revalidatePath(`/approvals/${quotationId}`);
      revalidatePath(`/approvals/${quotation.displayCode}`);
      revalidatePath(`/quotations/${quotation.displayCode}`);
      revalidatePath("/approvals");
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      message: `Quotation ${quotation.displayCode} returned to Draft for rep revision.`,
    };
  } catch (error: any) {
    console.error("Failed to return quotation:", error);
    return { success: false, error: error.message || "Failed to return quotation." };
  }
}

/**
 * Rejects a quotation and marks it dead (Screen 6).
 */
export async function rejectQuotationAction(
  quotationId: string,
  reason?: string
): Promise<ApprovalActionResult> {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return { success: false, error: "Authenticated user not found." };
    }

    if (actor.role === "REP") {
      return {
        success: false,
        error: "Unauthorized: Sales Representatives are not permitted to reject quotations. This action is restricted to designated approvers.",
      };
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { approvalSteps: true },
    });

    if (!quotation) {
      return { success: false, error: "Quotation not found." };
    }

    const pendingStep = quotation.approvalSteps.find(
      (s) => s.status === ApprovalStepStatus.PENDING
    );

    if (pendingStep) {
      if (
        pendingStep.requiredRole === ApprovalStepRole.SALES_MANAGER &&
        actor.role !== "MANAGER" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Sales Manager role.",
        };
      }
      if (
        pendingStep.requiredRole === ApprovalStepRole.FINANCE &&
        actor.role !== "FINANCE" &&
        actor.role !== "ADMIN"
      ) {
        return {
          success: false,
          error: "Unauthorized: This approval step requires a Finance role.",
        };
      }

      await prisma.approvalStep.update({
        where: { id: pendingStep.id },
        data: {
          status: ApprovalStepStatus.REJECTED,
          actedByUserId: actor.id,
          actedAt: new Date(),
          note: reason || undefined,
        },
      });
    }

    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        stage: QuotationStage.REJECTED,
        lastActivityAt: new Date(),
      },
    });

    await prisma.auditLogEntry.create({
      data: {
        quotationId,
        actorUserId: actor.id,
        action: AuditAction.REJECTED,
        note: reason ? `${actor.name} rejected: ${reason}` : `${actor.name} rejected quotation.`,
      },
    });

    try {
      revalidatePath(`/approvals/${quotationId}`);
      revalidatePath(`/approvals/${quotation.displayCode}`);
      revalidatePath("/approvals");
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      message: `Quotation ${quotation.displayCode} has been rejected.`,
    };
  } catch (error: any) {
    console.error("Failed to reject quotation:", error);
    return { success: false, error: error.message || "Failed to reject quotation." };
  }
}
