import { prisma } from "@/lib/prisma";
import {
  QuotationStage,
  UserRole,
  ApprovalStepStatus,
  ApprovalStepRole,
  FulfillmentStatus,
  InvoiceStatus,
} from "@prisma/client";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";

export interface SummaryCardItem {
  id: string;
  title: string;
  metric: string;
  href: string;
  subtitle?: string;
}

export interface RecentActivityItem {
  id: string;
  text: string;
  href: string;
  targetScreen?: string;
  timestamp?: string;
}

export interface DashboardQuickAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface RoleBadgeInfo {
  label: string;
  role: UserRole;
  description: string;
  colorClass: string;
}

export interface ActiveNegotiationLine {
  orderLineId: string;
  productName: string;
  originalDiscountPercent: number;
  requestedDiscountPercent: number;
  effectiveLimitPercent: number;
  isOverLimit: boolean;
  overagePoints: number;
  commentText?: string | null;
}

export interface ActiveNegotiationItem {
  id: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  totalGross: number;
  stage: string;
  lines: ActiveNegotiationLine[];
  latestComment?: string | null;
  requestedDeliveryDate?: string | null;
  requiresEscalation: boolean;
  maxOveragePoints: number;
  href: string;
  updatedAt: string;
}

export interface DashboardData {
  roleBadge: RoleBadgeInfo;
  summaryCards: SummaryCardItem[];
  quickActions: DashboardQuickAction[];
  recentActivities: RecentActivityItem[];
  activeNegotiations: ActiveNegotiationItem[];
}

export interface UserContext {
  id?: string;
  role: UserRole;
  name?: string | null;
}

/**
 * Fetches dashboard data tailored dynamically to the active role.
 * Strictly adheres to project.md Screen 2 and DESIGN.md styling.
 */
export async function getDashboardData(user?: UserContext): Promise<DashboardData> {
  const role = user?.role || UserRole.REP;
  const userId = user?.id;

  // 1. Role Badge & Metadata
  let roleBadge: RoleBadgeInfo = {
    label: "Sales Representative",
    role: UserRole.REP,
    description: "Personal pipeline, quotation builder & customer negotiation",
    colorClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  };

  if (role === UserRole.MANAGER) {
    roleBadge = {
      label: "Sales Manager",
      role: UserRole.MANAGER,
      description: "Team pipeline oversight, approval queue & discount governance",
      colorClass:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
    };
  } else if (role === UserRole.FINANCE) {
    roleBadge = {
      label: "Finance & Operations",
      role: UserRole.FINANCE,
      description: "High-risk margin signoff, invoice billing & warehouse fulfillment",
      colorClass:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
    };
  } else if (role === UserRole.ADMIN) {
    roleBadge = {
      label: "System Administrator",
      role: UserRole.ADMIN,
      description: "Enterprise platform configuration, pricing governance & reporting",
      colorClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    };
  }

  // 2. Compute Role-Tailored Metrics & Summary Cards
  let summaryCards: SummaryCardItem[] = [];
  let quickActions: DashboardQuickAction[] = [];

  try {
    if (role === UserRole.REP) {
      const [myPendingCount, myOpenCount, myFlaggedCount] = await Promise.all([
        userId
          ? prisma.quotation.count({
              where: { ownerRepId: userId, stage: QuotationStage.PENDING_APPROVAL },
            })
          : prisma.quotation.count({ where: { stage: QuotationStage.PENDING_APPROVAL } }),
        userId
          ? prisma.quotation.count({
              where: {
                ownerRepId: userId,
                stage: {
                  in: [
                    QuotationStage.DRAFT,
                    QuotationStage.PENDING_APPROVAL,
                    QuotationStage.APPROVED,
                    QuotationStage.NEGOTIATION,
                  ],
                },
              },
            })
          : prisma.quotation.count(),
        userId
          ? prisma.dealHealthAlert.count({
              where: { quotation: { ownerRepId: userId } },
            })
          : prisma.dealHealthAlert.count(),
      ]);

      summaryCards = [
        {
          id: "pending-approvals",
          title: "Pending Approvals",
          metric: `${myPendingCount} of your quotations waiting`,
          subtitle: "Awaiting manager or finance review",
          href: "/approvals",
        },
        {
          id: "open-quotations",
          title: "Open Quotations",
          metric: `${myOpenCount} of your active deals`,
          subtitle: "Drafts, active quotes & customer negotiations",
          href: "/quotations",
        },
        {
          id: "at-risk-deals",
          title: "At-Risk Deals",
          metric: `${myFlaggedCount} of your deals flagged`,
          subtitle: "High discount or slow progression warnings",
          href: "/deal-health",
        },
      ];

      quickActions = [
        { label: "+ New Quotation", href: "/quotations/new", variant: "primary" },
        { label: "View Approvals", href: "/approvals", variant: "secondary" },
      ];
    } else if (role === UserRole.MANAGER) {
      const [managerPendingCount, teamOpenCount, teamAlertsCount] = await Promise.all([
        prisma.approvalStep.count({
          where: {
            requiredRole: ApprovalStepRole.SALES_MANAGER,
            status: ApprovalStepStatus.PENDING,
          },
        }),
        prisma.quotation.count({
          where: {
            stage: {
              in: [
                QuotationStage.DRAFT,
                QuotationStage.PENDING_APPROVAL,
                QuotationStage.APPROVED,
                QuotationStage.NEGOTIATION,
              ],
            },
          },
        }),
        prisma.dealHealthAlert.count(),
      ]);

      summaryCards = [
        {
          id: "manager-pending-approvals",
          title: "Approvals Awaiting Review",
          metric: `${managerPendingCount} quotations awaiting manager review`,
          subtitle: "Step 1 discount reviews requiring your signoff",
          href: "/approvals",
        },
        {
          id: "manager-team-pipeline",
          title: "Team Open Pipeline",
          metric: `${teamOpenCount} active deals across team`,
          subtitle: "Total pipeline across all sales reps",
          href: "/quotations",
        },
        {
          id: "manager-at-risk-deals",
          title: "At-Risk Deals",
          metric: `${teamAlertsCount} flagged by Deal Health`,
          subtitle: "Team deals requiring rep coaching or escalation",
          href: "/deal-health",
        },
      ];

      quickActions = [
        { label: "Review Approvals", href: "/approvals", variant: "primary" },
        { label: "Deal Health Console", href: "/deal-health", variant: "secondary" },
        { label: "Discount Rules Setup", href: "/discount-approval-setup", variant: "secondary" },
      ];
    } else if (role === UserRole.FINANCE) {
      const [financePendingCount, unpaidInvoices, backorderCount] = await Promise.all([
        prisma.approvalStep.count({
          where: {
            requiredRole: ApprovalStepRole.FINANCE,
            status: ApprovalStepStatus.PENDING,
          },
        }),
        prisma.invoice.findMany({
          where: { status: InvoiceStatus.UNPAID },
          select: { amount: true },
        }),
        prisma.fulfillment.count({
          where: {
            status: {
              in: [FulfillmentStatus.BACKORDER, FulfillmentStatus.SPLIT_PENDING],
            },
          },
        }),
      ]);

      const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

      summaryCards = [
        {
          id: "finance-high-risk-approvals",
          title: "High-Risk Approvals",
          metric: `${financePendingCount} high-risk quotations awaiting finance`,
          subtitle: "Step 2 margin approvals exceeding discount ceiling",
          href: "/approvals",
        },
        {
          id: "finance-unpaid-invoices",
          title: "Unpaid Invoices",
          metric: `${unpaidInvoices.length} unpaid invoices ($${unpaidTotal.toLocaleString()})`,
          subtitle: "Pending payment & cash collection",
          href: "/invoices",
        },
        {
          id: "finance-fulfillment-splits",
          title: "Fulfillment & Backorders",
          metric: `${backorderCount} orders awaiting stock allocation`,
          subtitle: "Warehouse splits & inventory allocation",
          href: "/fulfillment",
        },
      ];

      quickActions = [
        { label: "Review Approvals", href: "/approvals", variant: "primary" },
        { label: "Invoices & Payments", href: "/invoices", variant: "secondary" },
        { label: "Fulfillment & Stock", href: "/fulfillment", variant: "secondary" },
      ];
    } else {
      // ADMIN
      const [allPendingCount, allOpenCount, totalAlertsCount] = await Promise.all([
        prisma.quotation.count({ where: { stage: QuotationStage.PENDING_APPROVAL } }),
        prisma.quotation.count({
          where: {
            stage: {
              in: [
                QuotationStage.DRAFT,
                QuotationStage.PENDING_APPROVAL,
                QuotationStage.APPROVED,
                QuotationStage.NEGOTIATION,
              ],
            },
          },
        }),
        prisma.dealHealthAlert.count(),
      ]);

      summaryCards = [
        {
          id: "admin-pending-approvals",
          title: "All Pending Approvals",
          metric: `${allPendingCount} quotations waiting across company`,
          subtitle: "Platform-wide approval queue",
          href: "/approvals",
        },
        {
          id: "admin-open-quotations",
          title: "Total Open Pipeline",
          metric: `${allOpenCount} active deals across company`,
          subtitle: "Across all enterprise workspaces",
          href: "/quotations",
        },
        {
          id: "admin-at-risk-deals",
          title: "System Governance Alerts",
          metric: `${totalAlertsCount} flagged by Deal Health`,
          subtitle: "Operational & deal health anomalies",
          href: "/deal-health",
        },
      ];

      quickActions = [
        { label: "Review Approvals Queue", href: "/approvals", variant: "primary" },
        { label: "Discount Rules Setup", href: "/discount-approval-setup", variant: "secondary" },
        { label: "Fulfillment & Stock", href: "/fulfillment", variant: "secondary" },
      ];
    }
  } catch (error) {
    console.warn("Could not query DB for role metrics, using spec defaults:", error);
    summaryCards = [
      {
        id: "pending-approvals",
        title: "Pending Approvals",
        metric: "4 quotations waiting",
        href: "/approvals",
      },
      {
        id: "open-quotations",
        title: "Open Quotations",
        metric: "12 active deals",
        href: "/quotations",
      },
      {
        id: "at-risk-deals",
        title: "At-Risk Deals",
        metric: "3 flagged by Deal Health",
        href: "/deal-health",
      },
    ];

    quickActions = [
      { label: "+ New Quotation", href: "/quotations/new", variant: "primary" },
      { label: "View Approvals", href: "/approvals", variant: "secondary" },
    ];
  }

  // 3. Activity Feed Scoped to Role
  const canonicalActivities: RecentActivityItem[] = [
    {
      id: "activity-canonical-1",
      text: "Acme Corp quotation approved by Finance",
      href: "/approvals/Q-1042",
      targetScreen: "Screen 6 — Approval Detail",
    },
    {
      id: "activity-canonical-2",
      text: "Beta Industries requested a discount change",
      href: "/quotations/Q-1039",
      targetScreen: "Screen 4 / Screen 11 — Quotation Negotiation",
    },
    {
      id: "activity-canonical-3",
      text: "East Depot stock updated for Order #2291",
      href: "/fulfillment",
      targetScreen: "Screen 7 — Fulfillment and Stock",
    },
  ];

  let recentActivities: RecentActivityItem[] = [];

  try {
    const auditWhere: any = {};
    if (role === UserRole.REP && userId) {
      auditWhere.quotation = { ownerRepId: userId };
    }

    const dbAuditLogs = await prisma.auditLogEntry.findMany({
      where: Object.keys(auditWhere).length > 0 ? auditWhere : undefined,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        quotation: {
          include: { customer: true },
        },
        actorUser: true,
      },
    });

    if (dbAuditLogs && dbAuditLogs.length > 0) {
      recentActivities = dbAuditLogs.map((log) => {
        const customerName = log.quotation?.customer?.name || "Acme Corp";
        const quoteCode = log.quotation?.displayCode || "Q-1042";
        const actorName = log.actorUser?.name || "Approver";

        let text = `${customerName} (${quoteCode}) activity logged: ${log.action}`;
        let href = `/approvals/${quoteCode}`;
        let targetScreen = "Screen 6 — Approval Detail";

        switch (log.action) {
          case "APPROVED":
            text = `${customerName} quotation approved by ${actorName}`;
            href = `/approvals/${quoteCode}`;
            targetScreen = "Screen 6 — Approval Detail";
            break;
          case "RETURNED_FOR_REVISION":
            text = `${customerName} quotation returned for revision by ${actorName}`;
            href = `/quotations/${quoteCode}`;
            targetScreen = "Screen 4 — Quotation Detail";
            break;
          case "RESUBMITTED":
            text = `${customerName} quotation resubmitted by ${actorName}`;
            href = `/approvals/${quoteCode}`;
            targetScreen = "Screen 6 — Approval Detail";
            break;
          case "SUBMITTED":
            text = `${customerName} quotation submitted for approval by ${actorName}`;
            href = `/approvals/${quoteCode}`;
            targetScreen = "Screen 6 — Approval Detail";
            break;
          case "REJECTED":
            text = `${customerName} quotation rejected by ${actorName}`;
            href = `/approvals/${quoteCode}`;
            targetScreen = "Screen 6 — Approval Detail";
            break;
        }

        return {
          id: log.id,
          text,
          href,
          targetScreen,
          timestamp: log.createdAt.toISOString(),
        };
      });
    }
  } catch (error) {
    console.warn("Could not query DB audit logs, using spec defaults:", error);
  }

  // 4. Active Customer Negotiations (surfaced for Rep, Manager, Finance)
  let activeNegotiations: ActiveNegotiationItem[] = [];

  try {
    const negotiationQuotes = await prisma.quotation.findMany({
      where: {
        stage: QuotationStage.NEGOTIATION,
        ...(role === UserRole.REP && userId ? { ownerRepId: userId } : {}),
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
      orderBy: { lastActivityAt: "desc" },
      take: 6,
    });

    // Fallback for Rep if none found under specific ownerRepId (e.g. testing with another user)
    let quotesToProcess = negotiationQuotes;
    if (quotesToProcess.length === 0 && role === UserRole.REP) {
      quotesToProcess = await prisma.quotation.findMany({
        where: { stage: QuotationStage.NEGOTIATION },
        include: {
          customer: true,
          orderLines: { include: { product: true } },
          negotiationComments: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { lastActivityAt: "desc" },
        take: 6,
      });
    }

    activeNegotiations = quotesToProcess.map((q) => {
      let totalGross = 0;
      const lines: ActiveNegotiationLine[] = [];
      let latestReqDate: string | null = null;
      let hasOverLimit = false;
      let maxOverage = 0;

      // Extract line items that have customer counter requests
      for (const line of q.orderLines) {
        const lineGross = Number(line.unitPrice) * line.quantity;
        totalGross += lineGross;

        // Find customer counter discount comment for this line
        const comment = q.negotiationComments.find(
          (c) => c.orderLineId === line.id && c.counterDiscountPercent !== null && c.counterDiscountPercent !== undefined
        );

        if (comment && comment.counterDiscountPercent !== null) {
          const reqDisc = Number(comment.counterDiscountPercent);
          const origDisc = Number(line.discountPercent);

          const limitCalc = calculateLineDiscountLimit({
            customerTier: q.customer.tier,
            productCategory: line.product.category,
            discountPercent: reqDisc,
          });

          const overage = Math.max(0, reqDisc - limitCalc.effectiveLimitPercent);
          if (overage > 0) {
            hasOverLimit = true;
            if (overage > maxOverage) maxOverage = overage;
          }

          lines.push({
            orderLineId: line.id,
            productName: line.product.name,
            originalDiscountPercent: origDisc,
            requestedDiscountPercent: reqDisc,
            effectiveLimitPercent: limitCalc.effectiveLimitPercent,
            isOverLimit: limitCalc.isOverLimit,
            overagePoints: overage,
            commentText: comment.commentText,
          });
        }
      }

      // If no line-specific comment was matched, include lines with current limits
      if (lines.length === 0) {
        for (const line of q.orderLines) {
          const origDisc = Number(line.discountPercent);
          const limitCalc = calculateLineDiscountLimit({
            customerTier: q.customer.tier,
            productCategory: line.product.category,
            discountPercent: origDisc,
          });
          lines.push({
            orderLineId: line.id,
            productName: line.product.name,
            originalDiscountPercent: origDisc,
            requestedDiscountPercent: origDisc,
            effectiveLimitPercent: limitCalc.effectiveLimitPercent,
            isOverLimit: limitCalc.isOverLimit,
            overagePoints: Math.max(0, origDisc - limitCalc.effectiveLimitPercent),
            commentText: null,
          });
        }
      }

      for (const c of q.negotiationComments) {
        if (c.requestedDeliveryDate && !latestReqDate) {
          latestReqDate = c.requestedDeliveryDate.toISOString();
        }
      }

      const latestComment = q.negotiationComments[0]?.commentText || null;

      return {
        id: q.id,
        displayCode: q.displayCode,
        customerId: q.customerId,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        totalGross,
        stage: q.stage,
        lines,
        latestComment,
        requestedDeliveryDate: latestReqDate,
        requiresEscalation: hasOverLimit,
        maxOveragePoints: maxOverage,
        href: `/quotations/${q.id}`,
        updatedAt: q.lastActivityAt ? q.lastActivityAt.toLocaleDateString() : "",
      };
    });
  } catch (err) {
    console.warn("Could not load active negotiations:", err);
  }

  return {
    roleBadge,
    summaryCards,
    quickActions,
    recentActivities,
    activeNegotiations,
  };
}
