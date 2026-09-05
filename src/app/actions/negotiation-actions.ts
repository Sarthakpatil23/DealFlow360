"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  QuotationStage,
  AuditAction,
  RiskLevel,
  ApprovalStepRole,
  ApprovalStepStatus,
  UserRole,
  ProductCategory,
} from "@prisma/client";
import { calculateBlendedRiskScore } from "@/lib/business-logic/blended-risk-score";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";

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
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    displayCode: string;
    customerName: string;
    itemsCount: number;
    requestedDate?: string | null;
    overLimitCount: number;
  };
}> {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {}
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: quotationId }, { displayCode: quotationId }],
      },
      include: {
        customer: true,
        orderLines: {
          include: { product: true },
        },
      },
    });

    if (!q) {
      return { success: false, error: "Quotation not found." };
    }

    const deliveryDate = requestedDeliveryDate ? new Date(requestedDeliveryDate) : null;

    // Filter non-empty comments or counter discounts
    const validComments = comments.filter(
      (c) =>
        c.commentText?.trim() ||
        (c.counterDiscountPercent !== undefined && !isNaN(c.counterDiscountPercent))
    );

    if (validComments.length === 0 && !deliveryDate) {
      return { success: false, error: "Please enter at least one comment, counter-discount, or delivery date." };
    }

    let overLimitCount = 0;

    // Create negotiation comment records
    for (const c of validComments) {
      const line = q.orderLines.find((l) => l.id === c.orderLineId);
      if (line && c.counterDiscountPercent !== undefined && !isNaN(c.counterDiscountPercent)) {
        const lim = calculateLineDiscountLimit({
          customerTier: q.customer.tier,
          productCategory: line.product.category,
          discountPercent: c.counterDiscountPercent,
        });
        if (lim.isOverLimit) {
          overLimitCount++;
        }
      }

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
        note: `Customer submitted counter-negotiation: ${validComments.length} proposal(s). Over-limit items: ${overLimitCount}.`,
      },
    });

    try {
      revalidatePath(`/portal`);
      revalidatePath(`/portal/${q.id}`);
      revalidatePath(`/quotations/${q.id}`);
      revalidatePath(`/quotations/${q.displayCode}`);
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
      revalidatePath("/approvals");
    } catch {}

    return {
      success: true,
      message: "Counter-negotiation request sent to your Sales Representative successfully! The quote is now Under Negotiation.",
      details: {
        displayCode: q.displayCode,
        customerName: q.customer.name,
        itemsCount: validComments.length,
        requestedDate: requestedDeliveryDate || null,
        overLimitCount,
      },
    };
  } catch (err: any) {
    console.error("Error submitting negotiation request:", err);
    return { success: false, error: err.message || "Failed to submit request." };
  }
}

/**
 * Sales Rep response to customer counter-negotiation.
 *
 * Rules:
 * 1. If rep accepts customer ask AND final terms are <= limits (LOW risk):
 *    - Rep has full authority to approve directly.
 *    - Stage moves to APPROVED.
 *    - No manager or finance escalation required.
 *
 * 2. If rep accepts customer ask AND final terms exceed limits (MEDIUM or HIGH risk):
 *    - Commercial limits breached!
 *    - Stage moves to PENDING_APPROVAL.
 *    - Step 1: SALES_MANAGER is spawned.
 *    - If HIGH risk, Step 2: FINANCE is spawned.
 *    - Routed to manager/finance approval queue.
 *
 * 3. Rep can also propose counter-terms or decline counter-offer.
 */
export async function respondToCounterNegotiationAction(
  quotationId: string,
  decision: "ACCEPT" | "COUNTER" | "DECLINE",
  acceptedDiscounts?: Record<string, number>, // orderLineId -> discountPercent
  repNote?: string,
  revisedDeliveryDate?: string
): Promise<{
  success: boolean;
  decision?: string;
  stage?: string;
  requiresEscalation?: boolean;
  riskLevel?: string;
  message?: string;
  error?: string;
  details?: {
    displayCode: string;
    customerName: string;
    linesUpdated: number;
    escalatedRoles?: string[];
  };
}> {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {}
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: quotationId }, { displayCode: quotationId }],
      },
      include: {
        customer: true,
        orderLines: {
          include: { product: true },
        },
        negotiationComments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!q) {
      return { success: false, error: "Quotation not found." };
    }

    const actorUserId = session?.user?.id || q.ownerRepId;

    // -------------------------------------------------------------
    // OPTION 1: ACCEPT CUSTOMER COUNTER-OFFER
    // -------------------------------------------------------------
    if (decision === "ACCEPT") {
      // Determine final discounts for each line:
      // either from acceptedDiscounts parameter, or pull latest counterDiscountPercent from negotiation comments
      const discountsToApply: Record<string, number> = { ...(acceptedDiscounts || {}) };

      // If specific discounts weren't passed, look up customer's counter proposals on order lines
      if (Object.keys(discountsToApply).length === 0) {
        for (const line of q.orderLines) {
          const comment = q.negotiationComments.find(
            (c) => c.orderLineId === line.id && c.counterDiscountPercent !== null && c.counterDiscountPercent !== undefined
          );
          if (comment && comment.counterDiscountPercent !== null) {
            discountsToApply[line.id] = Number(comment.counterDiscountPercent);
          } else {
            discountsToApply[line.id] = Number(line.discountPercent);
          }
        }
      }

      // Update OrderLine records with accepted discounts and recompute effectiveLimit
      let updatedCount = 0;
      const discountItemsForRisk: { category: ProductCategory; discountPercent: number }[] = [];

      for (const line of q.orderLines) {
        const newDisc = discountsToApply[line.id] !== undefined ? discountsToApply[line.id] : Number(line.discountPercent);
        const limitCalc = calculateLineDiscountLimit({
          customerTier: q.customer.tier,
          productCategory: line.product.category,
          discountPercent: newDisc,
        });

        await prisma.orderLine.update({
          where: { id: line.id },
          data: {
            discountPercent: newDisc,
            effectiveLimitPercent: limitCalc.effectiveLimitPercent,
          },
        });

        discountItemsForRisk.push({
          category: line.product.category as ProductCategory,
          discountPercent: newDisc,
        });

        if (newDisc !== Number(line.discountPercent)) {
          updatedCount++;
        }
      }

      // Recalculate Blended Risk Score based on updated discounts
      const riskResult = await calculateBlendedRiskScore(
        q.customer.tier,
        discountItemsForRisk
      );

      // Save rep response comment
      await prisma.negotiationComment.create({
        data: {
          quotationId: q.id,
          authorUserId: actorUserId,
          commentText:
            repNote?.trim() ||
            (riskResult.riskLevel === RiskLevel.LOW
              ? "Accepted customer counter-offer. Discounts approved within commercial delegation limits."
              : `Accepted customer counter-offer. Ask exceeds limits (${riskResult.riskLevel} risk) — submitted for managerial signoff.`),
        },
      });

      // CASE A: WITHIN LIMITS (LOW RISK) -> Rep Approves directly!
      if (riskResult.riskLevel === RiskLevel.LOW) {
        await prisma.quotation.update({
          where: { id: q.id },
          data: {
            stage: QuotationStage.APPROVED,
            blendedRiskLevel: RiskLevel.LOW,
            lastActivityAt: new Date(),
          },
        });

        await prisma.auditLogEntry.create({
          data: {
            quotationId: q.id,
            actorUserId: actorUserId,
            action: AuditAction.APPROVED,
            note: `Sales Rep accepted customer counter-offer within allowed discount limits. Quotation approved directly.`,
          },
        });

        revalidateAll(q.id, q.displayCode);

        return {
          success: true,
          decision: "ACCEPT",
          requiresEscalation: false,
          stage: QuotationStage.APPROVED,
          riskLevel: "LOW",
          message:
            "Counter-offer accepted! The requested discounts are within your commercial authority limits. The quotation has been Approved directly and is ready for final customer confirmation.",
          details: {
            displayCode: q.displayCode,
            customerName: q.customer.name,
            linesUpdated: updatedCount,
            escalatedRoles: [],
          },
        };
      }

      // CASE B: OVER LIMIT (MEDIUM OR HIGH RISK) -> Escalates to Manager / Finance!
      await prisma.quotation.update({
        where: { id: q.id },
        data: {
          stage: QuotationStage.PENDING_APPROVAL,
          blendedRiskLevel: riskResult.riskLevel,
          lastActivityAt: new Date(),
        },
      });

      // Clear existing pending approval steps and setup new chain
      await prisma.approvalStep.deleteMany({
        where: { quotationId: q.id },
      });

      // Step 1: Sales Manager
      await prisma.approvalStep.create({
        data: {
          quotationId: q.id,
          stepOrder: 1,
          requiredRole: ApprovalStepRole.SALES_MANAGER,
          status: ApprovalStepStatus.PENDING,
        },
      });

      const escalatedRoles = ["Sales Manager"];

      // Step 2: Finance (if HIGH risk)
      if (riskResult.riskLevel === RiskLevel.HIGH) {
        await prisma.approvalStep.create({
          data: {
            quotationId: q.id,
            stepOrder: 2,
            requiredRole: ApprovalStepRole.FINANCE,
            status: ApprovalStepStatus.PENDING,
          },
        });
        escalatedRoles.push("Finance & Operations");
      }

      await prisma.auditLogEntry.create({
        data: {
          quotationId: q.id,
          actorUserId: actorUserId,
          action: AuditAction.SUBMITTED,
          note: `Customer counter-offer exceeds discount limits (${riskResult.riskLevel} risk). Escalated to ${escalatedRoles.join(
            " & "
          )} for approval.`,
        },
      });

      revalidateAll(q.id, q.displayCode);

      return {
        success: true,
        decision: "ACCEPT",
        requiresEscalation: true,
        stage: QuotationStage.PENDING_APPROVAL,
        riskLevel: riskResult.riskLevel,
        message: `Customer counter-offer exceeds discount limits (${riskResult.riskLevel} risk). Quotation has been escalated to ${escalatedRoles.join(
          " and "
        )} for sign-off.`,
        details: {
          displayCode: q.displayCode,
          customerName: q.customer.name,
          linesUpdated: updatedCount,
          escalatedRoles,
        },
      };
    }

    // -------------------------------------------------------------
    // OPTION 2: PROPOSE COUNTER-OFFER (REVISE TERMS)
    // -------------------------------------------------------------
    if (decision === "COUNTER") {
      let updatedCount = 0;
      if (acceptedDiscounts) {
        for (const [lineId, newDisc] of Object.entries(acceptedDiscounts)) {
          const line = q.orderLines.find((l) => l.id === lineId);
          if (line) {
            const limitCalc = calculateLineDiscountLimit({
              customerTier: q.customer.tier,
              productCategory: line.product.category,
              discountPercent: Number(newDisc),
            });

            await prisma.orderLine.update({
              where: { id: line.id },
              data: {
                discountPercent: newDisc,
                effectiveLimitPercent: limitCalc.effectiveLimitPercent,
              },
            });
            updatedCount++;
          }
        }
      }

      await prisma.negotiationComment.create({
        data: {
          quotationId: q.id,
          authorUserId: actorUserId,
          commentText:
            repNote?.trim() || "Sales Rep proposed revised terms for customer consideration.",
        },
      });

      await prisma.quotation.update({
        where: { id: q.id },
        data: {
          stage: QuotationStage.NEGOTIATION,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditLogEntry.create({
        data: {
          quotationId: q.id,
          actorUserId: actorUserId,
          action: AuditAction.CONFIG_CHANGED,
          note: `Sales Rep counter-proposed revised quotation terms.`,
        },
      });

      revalidateAll(q.id, q.displayCode);

      return {
        success: true,
        decision: "COUNTER",
        stage: QuotationStage.NEGOTIATION,
        message: "Counter-proposal sent to customer! Your revised pricing terms are now visible on their negotiation portal.",
        details: {
          displayCode: q.displayCode,
          customerName: q.customer.name,
          linesUpdated: updatedCount,
        },
      };
    }

    // -------------------------------------------------------------
    // OPTION 3: DECLINE COUNTER-OFFER (REVERT / MAINTAIN ORIGINAL)
    // -------------------------------------------------------------
    if (decision === "DECLINE") {
      await prisma.negotiationComment.create({
        data: {
          quotationId: q.id,
          authorUserId: actorUserId,
          commentText:
            repNote?.trim() || "Sales Rep declined customer counter-offer. Original quotation terms maintained.",
        },
      });

      await prisma.quotation.update({
        where: { id: q.id },
        data: {
          stage: QuotationStage.APPROVED,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditLogEntry.create({
        data: {
          quotationId: q.id,
          actorUserId: actorUserId,
          action: AuditAction.CONFIG_CHANGED,
          note: `Sales Rep declined customer counter-offer. Original quotation terms kept.`,
        },
      });

      revalidateAll(q.id, q.displayCode);

      return {
        success: true,
        decision: "DECLINE",
        stage: QuotationStage.APPROVED,
        message: "Customer counter-offer declined. Original pricing and terms have been retained.",
        details: {
          displayCode: q.displayCode,
          customerName: q.customer.name,
          linesUpdated: 0,
        },
      };
    }

    return { success: false, error: "Invalid negotiation decision." };
  } catch (err: any) {
    console.error("Error responding to negotiation:", err);
    return { success: false, error: err.message || "Failed to process negotiation response." };
  }
}

function revalidateAll(id: string, code: string) {
  try {
    revalidatePath("/dashboard");
    revalidatePath("/quotations");
    revalidatePath(`/quotations/${id}`);
    revalidatePath(`/quotations/${code}`);
    revalidatePath("/portal");
    revalidatePath(`/portal/${id}`);
    revalidatePath(`/portal/${code}`);
    revalidatePath("/approvals");
    revalidatePath(`/approvals/${id}`);
    revalidatePath(`/approvals/${code}`);
  } catch {}
}
