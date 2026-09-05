import { prisma } from "@/lib/prisma";
import { QuotationStage, RiskLevel, ApprovalStepRole, ApprovalStepStatus } from "@prisma/client";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";

export interface ApprovalQueueItem {
  id: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  blendedRisk: RiskLevel | string;
  stage: QuotationStage | string;
  assignedRole: string;
  assignedUserName: string;
  createdAt: string;
  totalValue: number;
}

export interface ApprovalsScreenData {
  pendingCount: number;
  returnedCount: number;
  approvedCount: number;
  items: ApprovalQueueItem[];
}

export interface FlaggedLineBreakdown {
  id: string;
  productName: string;
  category: string;
  discountGiven: number;
  limitAllowed: number;
  overByPoints: number;
  statusText: string;
}

export interface AuditTrailItem {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  date: string;
  note: string;
}

export interface ApprovalStepItem {
  id: string;
  stepOrder: number;
  role: string;
  roleLabel: string;
  status: ApprovalStepStatus;
  actedByName?: string;
  actedAt?: string;
  note?: string;
}

export interface ApprovalDetailData {
  quotationId: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  currency: string;
  stage: QuotationStage;
  blendedRisk: RiskLevel;
  worstLineOverage: number;
  flaggedLines: FlaggedLineBreakdown[];
  steps: ApprovalStepItem[];
  auditTrail: AuditTrailItem[];
  currentRequiredRole: ApprovalStepRole | null;
  canApprove: boolean;
  userRole?: string;
  statusNotice?: string;
}

/**
 * Loads the approvals queue for Screen 5.
 */
export async function getApprovalsListData(): Promise<ApprovalsScreenData> {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        orderLines: true,
        approvalSteps: {
          orderBy: { stepOrder: "asc" },
          include: { actedByUser: true },
        },
      },
    });

    const pendingCount = quotations.filter(
      (q) => q.stage === QuotationStage.PENDING_APPROVAL
    ).length;

    const returnedCount = quotations.filter(
      (q) => q.stage === QuotationStage.DRAFT && q.approvalSteps.some((s) => s.status === "RETURNED")
    ).length;

    const approvedCount = quotations.filter(
      (q) => q.stage === QuotationStage.APPROVED || q.stage === QuotationStage.CONFIRMED
    ).length;

    // Map queue rows
    const items: ApprovalQueueItem[] = quotations.map((q) => {
      // Determine who it is currently assigned to
      const activeStep = q.approvalSteps.find((s) => s.status === ApprovalStepStatus.PENDING);
      let assignedRole = "—";
      let assignedUserName = "—";

      if (q.stage === QuotationStage.PENDING_APPROVAL && activeStep) {
        assignedRole =
          activeStep.requiredRole === ApprovalStepRole.SALES_MANAGER
            ? "Sales Manager"
            : "Finance";
        assignedUserName =
          activeStep.requiredRole === ApprovalStepRole.SALES_MANAGER
            ? "M. Shah"
            : "R. Iyer";
      } else if (q.stage === QuotationStage.APPROVED && (!q.blendedRiskLevel || q.blendedRiskLevel === "LOW")) {
        assignedRole = "Auto-Approved";
        assignedUserName = "—";
      }

      const totalValue = q.orderLines.reduce((acc, l) => {
        const p = Number(l.unitPrice) * l.quantity;
        const d = p * (Number(l.discountPercent) / 100);
        return acc + (p - d);
      }, 0);

      return {
        id: q.id,
        displayCode: q.displayCode,
        customerId: q.customerId,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        blendedRisk: q.blendedRiskLevel || "LOW",
        stage: q.stage,
        assignedRole,
        assignedUserName,
        createdAt: q.createdAt.toLocaleDateString(),
        totalValue,
      };
    });

    return {
      pendingCount,
      returnedCount,
      approvedCount,
      items,
    };
  } catch (error) {
    console.error("Error loading approvals list:", error);
    return {
      pendingCount: 0,
      returnedCount: 0,
      approvedCount: 0,
      items: [],
    };
  }
}

/**
 * Loads the complete approval detail and audit trail for Screen 6.
 */
export async function getApprovalDetailData(
  idOrCode: string,
  userRole?: string
): Promise<ApprovalDetailData | null> {
  try {
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrCode }, { displayCode: idOrCode }],
      },
      include: {
        customer: true,
        orderLines: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
        approvalSteps: {
          orderBy: { stepOrder: "asc" },
          include: { actedByUser: true },
        },
        auditLogEntries: {
          orderBy: { createdAt: "asc" },
          include: { actorUser: true },
        },
      },
    });

    if (!q) return null;

    // Evaluate per-line breakdown
    let worstOverage = 0;
    const flaggedLines: FlaggedLineBreakdown[] = q.orderLines.map((line) => {
      const limitCheck = calculateLineDiscountLimit({
        customerTier: q.customer.tier,
        productCategory: line.product.category,
        discountPercent: Number(line.discountPercent) || 0,
      });

      const overage = Math.max(0, (Number(line.discountPercent) || 0) - limitCheck.effectiveLimitPercent);
      if (overage > worstOverage) worstOverage = overage;

      return {
        id: line.id,
        productName: line.product.name,
        category: line.product.category,
        discountGiven: Number(line.discountPercent) || 0,
        limitAllowed: limitCheck.effectiveLimitPercent,
        overByPoints: overage,
        statusText: overage > 0 ? `${overage}pt OVER` : "0pt, OK",
      };
    });

    // Approval steps
    const steps: ApprovalStepItem[] = q.approvalSteps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      role: s.requiredRole,
      roleLabel:
        s.requiredRole === ApprovalStepRole.SALES_MANAGER ? "Sales Manager" : "Finance",
      status: s.status,
      actedByName: s.actedByUser?.name,
      actedAt: s.actedAt ? s.actedAt.toLocaleDateString() : undefined,
      note: s.note || undefined,
    }));

    // Audit trail items
    const auditTrail: AuditTrailItem[] = q.auditLogEntries.map((e) => ({
      id: e.id,
      userName: e.actorUser.name,
      userRole: e.actorUser.role,
      action: e.action,
      date: e.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      note: e.note || "—",
    }));

    // Find active step
    const pendingStep = q.approvalSteps.find((s) => s.status === ApprovalStepStatus.PENDING);
    const currentRequiredRole = pendingStep ? pendingStep.requiredRole : null;

    let canApprove = false;
    let statusNotice: string | undefined;

    if (q.stage === QuotationStage.PENDING_APPROVAL && pendingStep) {
      const requiredRoleName =
        pendingStep.requiredRole === ApprovalStepRole.SALES_MANAGER ? "Sales Manager" : "Finance";

      if (!userRole) {
        canApprove = true;
      } else if (userRole === "ADMIN") {
        canApprove = true;
      } else if (userRole === "MANAGER") {
        if (pendingStep.requiredRole === ApprovalStepRole.SALES_MANAGER) {
          canApprove = true;
        } else {
          statusNotice = "Step 1 approved. Awaiting second-level review by Finance.";
        }
      } else if (userRole === "FINANCE") {
        if (pendingStep.requiredRole === ApprovalStepRole.FINANCE) {
          canApprove = true;
        } else {
          statusNotice = "Awaiting initial Level 1 review from Sales Manager.";
        }
      } else if (userRole === "REP") {
        statusNotice = `Submitted for review. Awaiting sign-off by ${requiredRoleName}.`;
      }
    } else if (q.stage === QuotationStage.APPROVED || q.stage === QuotationStage.CONFIRMED) {
      statusNotice = "This quotation has been approved and moved to order processing.";
    } else if (q.stage === QuotationStage.REJECTED) {
      statusNotice = "This quotation has been rejected.";
    }

    return {
      quotationId: q.id,
      displayCode: q.displayCode,
      customerId: q.customerId,
      customerName: q.customer.name,
      customerTier: q.customer.tier,
      currency: q.currency,
      stage: q.stage,
      blendedRisk: q.blendedRiskLevel || RiskLevel.LOW,
      worstLineOverage: worstOverage,
      flaggedLines,
      steps,
      auditTrail,
      currentRequiredRole,
      canApprove,
      userRole,
      statusNotice,
    };
  } catch (error) {
    console.error("Error loading approval detail:", error);
    return null;
  }
}
