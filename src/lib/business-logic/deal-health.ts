import { prisma } from "@/lib/prisma";
import {
  DealHealthAlertType,
  DealHealthAlertAction,
  QuotationStage,
} from "@prisma/client";

export interface DealHealthItem {
  alertId?: string;
  quotationId: string;
  displayCode: string;
  customerName: string;
  customerTier: string;
  ownerRepName: string;
  ownerRepId: string;
  type: DealHealthAlertType;
  issueDescription: string;
  flaggedDate: string;
  actionTaken: DealHealthAlertAction;
  actionTakenAt: string | null;
  stage: string;
  totalValue: number;
}

export interface DealHealthMetrics {
  stalledCount: number;
  anomaliesCount: number;
  slippageCount: number;
  alerts: DealHealthItem[];
}

/**
 * Step 29: Evaluates live deal health anomalies across all quotes in the system.
 *
 * Rules from project.md:
 * 1. Stalled: Quote in Draft, Pending Approval, or Negotiation idle for > 7 days.
 * 2. Discount Anomaly: Quote discount significantly above rep's personal historical average.
 * 3. Delivery Slippage: Physical fulfillment backordered or delayed.
 */
export async function evaluateDealHealth(options?: {
  role?: string;
  repId?: string;
}): Promise<DealHealthMetrics> {
  const quotations = await prisma.quotation.findMany({
    include: {
      customer: true,
      ownerRep: true,
      orderLines: {
        include: { product: true },
      },
      fulfillment: {
        include: { lines: true },
      },
      dealHealthAlerts: true,
    },
    orderBy: { lastActivityAt: "desc" },
  });

  // Calculate historical average discount per sales rep
  const repTotals: Record<string, { sumDiscount: number; lineCount: number }> = {};
  for (const q of quotations) {
    if (!repTotals[q.ownerRepId]) {
      repTotals[q.ownerRepId] = { sumDiscount: 0, lineCount: 0 };
    }
    for (const line of q.orderLines) {
      repTotals[q.ownerRepId].sumDiscount += Number(line.discountPercent);
      repTotals[q.ownerRepId].lineCount += 1;
    }
  }

  const repAvgDiscount: Record<string, number> = {};
  for (const [repId, stats] of Object.entries(repTotals)) {
    repAvgDiscount[repId] = stats.lineCount > 0 ? stats.sumDiscount / stats.lineCount : 8.0;
  }

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const alerts: DealHealthItem[] = [];

  for (const q of quotations) {
    // If role is REP, only evaluate quotes owned by this rep
    if (options?.role === "REP" && options?.repId && q.ownerRepId !== options.repId) {
      continue;
    }

    const totalValue = q.orderLines.reduce((acc, l) => {
      const gross = Number(l.unitPrice) * l.quantity;
      const disc = gross * (Number(l.discountPercent) / 100);
      return acc + (gross - disc);
    }, 0);

    const quoteAvgDiscount =
      q.orderLines.length > 0
        ? q.orderLines.reduce((s, l) => s + Number(l.discountPercent), 0) / q.orderLines.length
        : 0;

    const repAvg = repAvgDiscount[q.ownerRepId] || 8.0;

    // 1. CHECK: STALLED DEALS
    // Non-confirmed quotes with no activity for > 7 days (or test threshold)
    const isUnconfirmed =
      q.stage === QuotationStage.DRAFT ||
      q.stage === QuotationStage.PENDING_APPROVAL ||
      q.stage === QuotationStage.NEGOTIATION;

    const daysIdle = Math.floor((now - new Date(q.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000));

    if (isUnconfirmed && daysIdle >= 7) {
      // Find existing alert in DB if any
      const existing = q.dealHealthAlerts.find((a) => a.type === DealHealthAlertType.STALLED);

      alerts.push({
        alertId: existing?.id,
        quotationId: q.id,
        displayCode: q.displayCode,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        ownerRepName: q.ownerRep.name,
        ownerRepId: q.ownerRepId,
        type: DealHealthAlertType.STALLED,
        issueDescription: `Idle ${daysIdle} days with zero customer/rep activity.`,
        flaggedDate: existing ? existing.flaggedAt.toLocaleDateString() : new Date(q.lastActivityAt).toLocaleDateString(),
        actionTaken: existing?.actionTaken || DealHealthAlertAction.NONE,
        actionTakenAt: existing?.actionTakenAt ? existing.actionTakenAt.toLocaleDateString() : null,
        stage: q.stage,
        totalValue,
      });
    }

    // 2. CHECK: DISCOUNT ANOMALIES
    // If quote discount is > 10 percentage points higher than rep average
    if (quoteAvgDiscount >= repAvg + 10 && quoteAvgDiscount > 15) {
      const existing = q.dealHealthAlerts.find(
        (a) => a.type === DealHealthAlertType.DISCOUNT_ANOMALY
      );

      alerts.push({
        alertId: existing?.id,
        quotationId: q.id,
        displayCode: q.displayCode,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        ownerRepName: q.ownerRep.name,
        ownerRepId: q.ownerRepId,
        type: DealHealthAlertType.DISCOUNT_ANOMALY,
        issueDescription: `Average discount ${quoteAvgDiscount.toFixed(1)}% vs rep historical avg ${repAvg.toFixed(1)}%.`,
        flaggedDate: existing ? existing.flaggedAt.toLocaleDateString() : new Date().toLocaleDateString(),
        actionTaken: existing?.actionTaken || DealHealthAlertAction.NONE,
        actionTakenAt: existing?.actionTakenAt ? existing.actionTakenAt.toLocaleDateString() : null,
        stage: q.stage,
        totalValue,
      });
    }

    // 3. CHECK: DELIVERY SLIPPAGE
    // Orders with backorders or unshipped stock for confirmed quotes
    const hasBackorders = q.fulfillment?.lines.some((l) => l.isBackordered);
    if (q.stage === QuotationStage.CONFIRMED && hasBackorders) {
      const existing = q.dealHealthAlerts.find(
        (a) => a.type === DealHealthAlertType.DELIVERY_SLIPPAGE
      );

      alerts.push({
        alertId: existing?.id,
        quotationId: q.id,
        displayCode: q.displayCode,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        ownerRepName: q.ownerRep.name,
        ownerRepId: q.ownerRepId,
        type: DealHealthAlertType.DELIVERY_SLIPPAGE,
        issueDescription: "Stock backordered across warehouse network. Delivery at risk.",
        flaggedDate: existing ? existing.flaggedAt.toLocaleDateString() : new Date().toLocaleDateString(),
        actionTaken: existing?.actionTaken || DealHealthAlertAction.NONE,
        actionTakenAt: existing?.actionTakenAt ? existing.actionTakenAt.toLocaleDateString() : null,
        stage: q.stage,
        totalValue,
      });
    }
  }

  // Also include any alerts stored in DB that might have been seeded
  const dbAlerts = await prisma.dealHealthAlert.findMany({
    include: {
      quotation: {
        include: {
          customer: true,
          ownerRep: true,
          orderLines: true,
        },
      },
    },
  });

  for (const dbA of dbAlerts) {
    if (options?.role === "REP" && options?.repId && dbA.quotation?.ownerRepId !== options.repId) {
      continue;
    }
    const alreadyIncluded = alerts.some((a) => a.quotationId === dbA.quotationId && a.type === dbA.type);
    if (!alreadyIncluded && dbA.quotation) {
      const total = dbA.quotation.orderLines.reduce((acc, l) => {
        const gross = Number(l.unitPrice) * l.quantity;
        const disc = gross * (Number(l.discountPercent) / 100);
        return acc + (gross - disc);
      }, 0);

      alerts.push({
        alertId: dbA.id,
        quotationId: dbA.quotation.id,
        displayCode: dbA.quotation.displayCode,
        customerName: dbA.quotation.customer.name,
        customerTier: dbA.quotation.customer.tier,
        ownerRepName: dbA.quotation.ownerRep.name,
        ownerRepId: dbA.quotation.ownerRepId,
        type: dbA.type,
        issueDescription: dbA.issueDescription,
        flaggedDate: dbA.flaggedAt.toLocaleDateString(),
        actionTaken: dbA.actionTaken,
        actionTakenAt: dbA.actionTakenAt ? dbA.actionTakenAt.toLocaleDateString() : null,
        stage: dbA.quotation.stage,
        totalValue: total,
      });
    }
  }

  const stalledCount = alerts.filter((a) => a.type === DealHealthAlertType.STALLED).length;
  const anomaliesCount = alerts.filter((a) => a.type === DealHealthAlertType.DISCOUNT_ANOMALY).length;
  const slippageCount = alerts.filter((a) => a.type === DealHealthAlertType.DELIVERY_SLIPPAGE).length;

  return {
    stalledCount,
    anomaliesCount,
    slippageCount,
    alerts,
  };
}
