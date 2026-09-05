"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";
import { calculateBlendedRiskScore } from "@/lib/business-logic/blended-risk-score";
import {
  RiskLevel,
  QuotationStage,
  ApprovalStepRole,
  ApprovalStepStatus,
  AuditAction,
  SubscriptionStatus,
  RecurringCycle,
  InvoiceType,
  InvoiceStatus,
} from "@prisma/client";

export interface LineItemData {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  effectiveLimitPercent: number;
  isUpsellAdd?: boolean;
}

export interface QuotationDetailData {
  id: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  priceListName: string;
  stage: string;
  currency: string;
  orderLines: LineItemData[];
}

/**
 * Generates the next sequential quotation display code (e.g. Q-1043).
 * Queries all existing quotation codes matching Q-<number> and returns Q-<max + 1>.
 */
export async function generateNextDisplayCode(): Promise<string> {
  const quotations = await prisma.quotation.findMany({
    select: { displayCode: true },
  });

  let maxNum = 1000;
  for (const q of quotations) {
    const match = q.displayCode.match(/Q-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `Q-${maxNum + 1}`;
}

export async function getQuotationForBuilder(idOrDisplayCode: string) {
  try {
    // If "new", generate next quotation code and pre-fill template
    if (idOrDisplayCode === "new") {
      const defaultCustomer =
        (await prisma.customer.findFirst({
          where: { name: "Acme Corp" },
        })) || (await prisma.customer.findFirst());

      const nextCode = await generateNextDisplayCode();

      const customerTier = (defaultCustomer?.tier || "GOLD") as any;
      const customerCurrency = defaultCustomer?.preferredCurrency || "USD";

      return {
        success: true,
        data: {
          id: "new",
          displayCode: nextCode,
          customerId: defaultCustomer?.id || "",
          customerName: defaultCustomer?.name || "Acme Corp",
          customerTier: customerTier,
          priceListName: `Standard (${customerCurrency}) — ${customerTier} Tier (${
            customerTier === "GOLD" ? "15%" : customerTier === "SILVER" ? "10%" : "5%"
          } Max)`,
          stage: "DRAFT",
          currency: customerCurrency,
          orderLines: [],
        } as QuotationDetailData,
      };
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrDisplayCode }, { displayCode: idOrDisplayCode }],
      },
      include: {
        customer: true,
        orderLines: {
          orderBy: { createdAt: "asc" },
          include: { product: true },
        },
      },
    });

    if (!quotation) {
      return { success: false, error: `Quotation "${idOrDisplayCode}" not found.` };
    }

    const lines: LineItemData[] = quotation.orderLines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: line.product?.name || "Unknown Product",
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      discountPercent: Number(line.discountPercent),
      effectiveLimitPercent: Number(line.effectiveLimitPercent),
      isUpsellAdd: line.isUpsellAdd,
    }));

    return {
      success: true,
      data: {
        id: quotation.id,
        displayCode: quotation.displayCode,
        customerId: quotation.customerId,
        customerName: quotation.customer.name,
        customerTier: quotation.customer.tier,
        priceListName: `Standard (${quotation.currency}) — ${quotation.customer.tier} Tier (${
          quotation.customer.tier === "GOLD"
            ? "15%"
            : quotation.customer.tier === "SILVER"
            ? "10%"
            : "5%"
        } Max)`,
        stage: quotation.stage,
        currency: quotation.currency,
        orderLines: lines,
      } as QuotationDetailData,
    };
  } catch (err: any) {
    console.error("Failed to load quotation:", err);
    return { success: false, error: err.message || "Failed to load quotation" };
  }
}

export async function getAvailableProductsList() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        basePrice: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      basePrice: Number(p.basePrice),
    }));
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export async function getAvailableCustomersList() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tier: true,
        preferredCurrency: true,
      },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      preferredCurrency: c.preferredCurrency,
    }));
  } catch (err) {
    console.error("Failed to fetch customers:", err);
    return [];
  }
}

export async function saveQuotationAsDraft(payload: {
  id?: string;
  displayCode?: string;
  customerId?: string;
  orderLines: LineItemData[];
}) {
  try {
    let quotationId = payload.id;
    let targetDisplayCode = payload.displayCode;

    // 1. If quotation doesn't exist yet or is "new", create a brand new quotation
    if (!quotationId || quotationId === "new") {
      // Validate or generate a unique display code
      if (!targetDisplayCode) {
        targetDisplayCode = await generateNextDisplayCode();
      } else {
        const existingWithCode = await prisma.quotation.findFirst({
          where: { displayCode: targetDisplayCode },
        });
        if (existingWithCode) {
          // Display code already taken by an existing quote, generate the next available code
          targetDisplayCode = await generateNextDisplayCode();
        }
      }

      // Determine owner rep (session or default rep)
      let ownerRepId: string | undefined;
      try {
        const session = await auth();
        if (session?.user?.id && session.user.role !== "CUSTOMER") {
          ownerRepId = session.user.id;
        }
      } catch {
        // Fallback if called outside auth context
      }

      if (!ownerRepId) {
        const defaultRep =
          (await prisma.user.findFirst({ where: { role: "REP" } })) ||
          (await prisma.user.findFirst());
        ownerRepId = defaultRep?.id;
      }

      const defaultCustomer =
        (payload.customerId
          ? await prisma.customer.findUnique({ where: { id: payload.customerId } })
          : null) ||
        (await prisma.customer.findFirst({ where: { name: "Acme Corp" } })) ||
        (await prisma.customer.findFirst());

      if (!defaultCustomer || !ownerRepId) {
        return { success: false, error: "Missing required customer or sales rep to create quotation." };
      }

      const created = await prisma.quotation.create({
        data: {
          displayCode: targetDisplayCode,
          customerId: defaultCustomer.id,
          ownerRepId: ownerRepId,
          stage: "DRAFT",
          currency: defaultCustomer.preferredCurrency || "USD",
        },
      });
      quotationId = created.id;
    } else {
      // Existing quotation update
      const existing = await prisma.quotation.findUnique({
        where: { id: quotationId },
      });
      if (!existing) {
        return { success: false, error: `Quotation "${quotationId}" not found.` };
      }
      targetDisplayCode = existing.displayCode;

      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          stage: "DRAFT",
          lastActivityAt: new Date(),
          ...(payload.customerId ? { customerId: payload.customerId } : {}),
        },
      });
    }

    // 2. Fetch customer tier to evaluate limits
    const currentCustomer = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });
    const customerTier = (currentCustomer?.customer.tier || "GOLD") as any;

    // 3. Fetch product map to resolve product IDs and categories
    const allProducts = await prisma.product.findMany();
    const productByName = new Map(allProducts.map((p) => [p.name.toLowerCase(), p]));
    const productById = new Map(allProducts.map((p) => [p.id, p]));

    // 4. Delete existing lines for this quotation and recreate with current saved state
    await prisma.orderLine.deleteMany({
      where: { quotationId },
    });

    if (payload.orderLines && payload.orderLines.length > 0) {
      const linesToCreate = payload.orderLines.map((line) => {
        const matchedProduct =
          (line.productId ? productById.get(line.productId) : null) ||
          productByName.get(line.productName.toLowerCase()) ||
          allProducts[0];

        // Recalculate effective limit percent using business logic rule
        const limitCheck = calculateLineDiscountLimit({
          customerTier,
          productCategory: matchedProduct.category,
          discountPercent: Number(line.discountPercent) || 0,
        });

        return {
          quotationId: quotationId!,
          productId: matchedProduct.id,
          quantity: Math.max(1, Number(line.quantity) || 1),
          unitPrice: Number(line.unitPrice) || Number(matchedProduct.basePrice),
          discountPercent: Number(line.discountPercent) || 0,
          effectiveLimitPercent: limitCheck.effectiveLimitPercent,
          isUpsellAdd: Boolean(line.isUpsellAdd),
        };
      });

      await prisma.orderLine.createMany({
        data: linesToCreate,
      });
    }

    try {
      revalidatePath(`/quotations/${targetDisplayCode}`);
      revalidatePath(`/quotations/${quotationId}`);
      revalidatePath("/quotations");
      revalidatePath("/dashboard");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      quotationId,
      displayCode: targetDisplayCode,
      message: `Quotation ${targetDisplayCode} saved as Draft successfully.`,
    };
  } catch (err: any) {
    console.error("Error saving quotation draft:", err);
    return { success: false, error: err.message || "Failed to save draft" };
  }
}

export async function submitQuotation(idOrDisplayCode: string) {
  try {
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrDisplayCode }, { displayCode: idOrDisplayCode }],
      },
      include: {
        customer: true,
        orderLines: {
          include: { product: true },
        },
      },
    });

    if (!q) {
      return { success: false, error: "Quotation not found" };
    }

    // 1. Determine actor (sales rep from session or ownerRep)
    let actorUserId = q.ownerRepId;
    try {
      const session = await auth();
      if (session?.user?.id) actorUserId = session.user.id;
    } catch {
      // Ignored outside Next.js request context
    }

    // 2. Evaluate Blended Discount Risk Score
    const linesToScore = q.orderLines.map((line) => ({
      category: line.product.category,
      discountPercent: Number(line.discountPercent) || 0,
    }));

    const riskResult = await calculateBlendedRiskScore(
      q.customer.tier,
      linesToScore
    );

    // 3. Auto-approve if LOW risk, otherwise route to approval chain
    if (riskResult.riskLevel === RiskLevel.LOW) {
      // Auto-approve: directly clears all approvals
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
          actorUserId,
          action: AuditAction.APPROVED,
          note: "Auto-approved: all discounts within limits (LOW risk).",
        },
      });

      try {
        revalidatePath(`/quotations/${q.displayCode}`);
        revalidatePath(`/quotations/${q.id}`);
        revalidatePath("/quotations");
        revalidatePath("/approvals");
        revalidatePath("/dashboard");
      } catch {}

      return {
        success: true,
        riskLevel: "LOW",
        stage: "APPROVED",
        message: `Quotation ${q.displayCode} auto-approved! Discounts are within ${q.customer.tier} tier limits.`,
      };
    }

    // 4. MEDIUM or HIGH risk: Generate required approval chain steps
    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        stage: QuotationStage.PENDING_APPROVAL,
        blendedRiskLevel: riskResult.riskLevel,
        lastActivityAt: new Date(),
      },
    });

    // Remove old pending approval steps if resubmitting
    await prisma.approvalStep.deleteMany({
      where: { quotationId: q.id },
    });

    // Step 1: Sales Manager is always required
    await prisma.approvalStep.create({
      data: {
        quotationId: q.id,
        stepOrder: 1,
        requiredRole: ApprovalStepRole.SALES_MANAGER,
        status: ApprovalStepStatus.PENDING,
      },
    });

    // Step 2: Finance is additionally required for HIGH risk
    if (riskResult.riskLevel === RiskLevel.HIGH) {
      await prisma.approvalStep.create({
        data: {
          quotationId: q.id,
          stepOrder: 2,
          requiredRole: ApprovalStepRole.FINANCE,
          status: ApprovalStepStatus.PENDING,
        },
      });
    }

    // Log the submission into immutable Audit Trail
    await prisma.auditLogEntry.create({
      data: {
        quotationId: q.id,
        actorUserId,
        action: AuditAction.SUBMITTED,
        note: `Submitted with ${riskResult.riskLevel} risk (+${riskResult.totalOveragePoints} overage points across lines).`,
      },
    });

    try {
      revalidatePath(`/quotations/${q.displayCode}`);
      revalidatePath(`/quotations/${q.id}`);
      revalidatePath("/quotations");
      revalidatePath("/approvals");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      riskLevel: riskResult.riskLevel,
      stage: "PENDING_APPROVAL",
      message: `Quotation ${q.displayCode} submitted for ${
        riskResult.riskLevel === RiskLevel.HIGH
          ? "Sales Manager & Finance"
          : "Sales Manager"
      } approval (${riskResult.riskLevel} risk).`,
    };
  } catch (err: any) {
    console.error("Error submitting quotation:", err);
    return { success: false, error: err.message || "Failed to submit quotation" };
  }
}

/**
 * Generates next sequential invoice code (e.g. INV-1044).
 */
export async function generateNextInvoiceCode(): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    select: { displayCode: true },
  });

  let maxNum = 1040;
  for (const inv of invoices) {
    const match = inv.displayCode.match(/INV-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `INV-${maxNum + 1}`;
}

/**
 * Confirms a quotation (by customer in portal or by sales rep).
 *
 * Implements:
 * - Step 28: Auto re-approval if final terms exceed limits.
 * - Step 22: Auto-creates Subscription records for recurring order lines.
 * - Step 21/25: Auto-creates Fulfillment records for physical order lines.
 */
export async function confirmQuotationAction(
  idOrCode: string,
  actorUserId?: string
): Promise<{
  success: boolean;
  reapprovalRequired?: boolean;
  stage?: string;
  message?: string;
  error?: string;
}> {
  try {
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrCode }, { displayCode: idOrCode }],
      },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!q) {
      return { success: false, error: "Quotation not found" };
    }

    // Resolve actor
    let resolvedActorId = actorUserId;
    if (!resolvedActorId) {
      const session = await auth();
      if (session?.user?.id) {
        resolvedActorId = session.user.id;
      } else {
        const fallbackUser = await prisma.user.findFirst();
        resolvedActorId = fallbackUser?.id || q.ownerRepId;
      }
    }

    // STEP 28: Check if final terms violate limits (Auto re-approval check)
    const discountItems = q.orderLines.map((line) => ({
      category: line.product.category,
      discountPercent: Number(line.discountPercent),
    }));

    const riskResult = await calculateBlendedRiskScore(q.customer.tier, discountItems);

    // If final terms are over-limit (MEDIUM or HIGH) and quotation wasn't previously approved for this:
    if (riskResult.riskLevel !== RiskLevel.LOW && q.stage !== QuotationStage.APPROVED) {
      await prisma.quotation.update({
        where: { id: q.id },
        data: {
          stage: QuotationStage.PENDING_APPROVAL,
          blendedRiskLevel: riskResult.riskLevel,
          lastActivityAt: new Date(),
        },
      });

      // Clear existing and set up fresh approval steps
      await prisma.approvalStep.deleteMany({
        where: { quotationId: q.id },
      });

      await prisma.approvalStep.create({
        data: {
          quotationId: q.id,
          stepOrder: 1,
          requiredRole: ApprovalStepRole.SALES_MANAGER,
          status: ApprovalStepStatus.PENDING,
        },
      });

      if (riskResult.riskLevel === RiskLevel.HIGH) {
        await prisma.approvalStep.create({
          data: {
            quotationId: q.id,
            stepOrder: 2,
            requiredRole: ApprovalStepRole.FINANCE,
            status: ApprovalStepStatus.PENDING,
          },
        });
      }

      await prisma.auditLogEntry.create({
        data: {
          quotationId: q.id,
          actorUserId: resolvedActorId,
          action: AuditAction.SUBMITTED,
          note: `Confirmation halted: Final agreed terms exceeded limits (+${riskResult.totalOveragePoints}pt). Auto re-entered ${riskResult.riskLevel} approval chain.`,
        },
      });

      revalidateAllQuotationPaths(q);

      return {
        success: true,
        reapprovalRequired: true,
        stage: "PENDING_APPROVAL",
        message: `Final terms exceed discount limits. Quotation automatically re-entered the approval flow (${riskResult.riskLevel} risk).`,
      };
    }

    // Terms are within limits or already approved: Move to CONFIRMED
    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        stage: QuotationStage.CONFIRMED,
        lastActivityAt: new Date(),
      },
    });

    await prisma.auditLogEntry.create({
      data: {
        quotationId: q.id,
        actorUserId: resolvedActorId,
        action: AuditAction.APPROVED,
        note: `Quotation confirmed as final order. Ready for fulfillment and billing.`,
      },
    });

    // STEP 22: Auto-create Subscription records for subscription products
    for (const line of q.orderLines) {
      if (line.product.isSubscription) {
        // Check if subscription already exists for this order line
        const existingSub = await prisma.subscription.findFirst({
          where: {
            customerId: q.customerId,
            originatingOrderLineId: line.id,
          },
        });

        if (!existingSub) {
          const cycleDays =
            line.product.recurringCycle === RecurringCycle.YEARLY
              ? 365
              : line.product.recurringCycle === RecurringCycle.QUARTERLY
              ? 90
              : 30;

          const nextBill = new Date();
          nextBill.setDate(nextBill.getDate() + cycleDays);

          const netPrice =
            Number(line.unitPrice) *
            (1 - Number(line.discountPercent) / 100) *
            line.quantity;

          const createdSub = await prisma.subscription.create({
            data: {
              customerId: q.customerId,
              quotationId: q.id,
              originatingOrderLineId: line.id,
              planName: line.product.name,
              cycle: line.product.recurringCycle || RecurringCycle.MONTHLY,
              pricePerCycle: netPrice,
              nextBillDate: nextBill,
              status: SubscriptionStatus.ACTIVE,
            },
          });

          // Generate first recurring cycle invoice
          const invCode = await generateNextInvoiceCode();
          await prisma.invoice.create({
            data: {
              displayCode: invCode,
              customerId: q.customerId,
              quotationId: q.id,
              subscriptionId: createdSub.id,
              type: InvoiceType.RECURRING,
              amount: netPrice,
              status: InvoiceStatus.UNPAID,
              dueDate: nextBill,
            },
          });
        }
      }
    }

    // Ensure Fulfillment record exists for any physical products
    const hasPhysicalLines = q.orderLines.some((l) => !l.product.isSubscription);
    if (hasPhysicalLines) {
      const existingFulfillment = await prisma.fulfillment.findUnique({
        where: { quotationId: q.id },
      });

      if (!existingFulfillment) {
        await prisma.fulfillment.create({
          data: {
            quotationId: q.id,
          },
        });
      }
    }

    revalidateAllQuotationPaths(q);

    return {
      success: true,
      reapprovalRequired: false,
      stage: "CONFIRMED",
      message: `Quotation ${q.displayCode} confirmed successfully! Order is now active.`,
    };
  } catch (err: any) {
    console.error("Error confirming quotation:", err);
    return { success: false, error: err.message || "Failed to confirm quotation" };
  }
}

function revalidateAllQuotationPaths(q: { id: string; displayCode: string }) {
  try {
    revalidatePath(`/quotations/${q.displayCode}`);
    revalidatePath(`/quotations/${q.id}`);
    revalidatePath("/quotations");
    revalidatePath("/approvals");
    revalidatePath("/subscriptions");
    revalidatePath("/invoices");
    revalidatePath("/fulfillment");
    revalidatePath("/dashboard");
    revalidatePath("/portal");
  } catch {}
}

