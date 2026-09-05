import { prisma } from "@/lib/prisma";
import { CustomerTier, ProductCategory, RiskLevel } from "@prisma/client";

export interface LineDiscountItem {
  category: ProductCategory;
  discountPercent: number;
}

export interface LineEvaluationResult {
  category: ProductCategory;
  discountPercent: number;
  tierLimit: number;
  categoryLimit: number;
  effectiveLimit: number;
  overagePoints: number;
  status: "OK" | string; // "OK" or "OVER (+Npt)"
}

export interface BlendedRiskScoreResult {
  riskLevel: RiskLevel;
  totalOveragePoints: number;
  worstLineOverage: number;
  requiredApprovalPath: string;
  lines: LineEvaluationResult[];
}

/**
 * Calculates line-level discount limits and blended risk score dynamically using
 * the database-configured TierDiscountCeiling, CategoryDiscountCeiling, and ApprovalChainThreshold.
 *
 * Strictly adheres to project.md Part 4 (Deep Dive — The Blended Discount Risk Score).
 */
export async function calculateBlendedRiskScore(
  customerTier: CustomerTier,
  lines: LineDiscountItem[]
): Promise<BlendedRiskScoreResult> {
  // 1. Fetch live ceilings and thresholds from DB with spec defaults
  let tierCeilings: Record<string, number> = {
    BRONZE: 5.0,
    SILVER: 10.0,
    GOLD: 15.0,
  };

  let categoryCeilings: Record<string, number> = {
    HARDWARE: 15.0,
    SERVICES: 10.0,
    SUBSCRIPTION: 15.0,
  };

  let mediumThreshold = 0.01;
  let highThreshold = 8.0;

  try {
    const [dbTiers, dbCats, dbThresholds] = await Promise.all([
      prisma.tierDiscountCeiling.findMany(),
      prisma.categoryDiscountCeiling.findMany(),
      prisma.approvalChainThreshold.findMany(),
    ]);

    dbTiers.forEach((t) => {
      tierCeilings[t.tier] = Number(t.maxDiscountPercent);
    });

    dbCats.forEach((c) => {
      categoryCeilings[c.category] = Number(c.maxDiscountPercent);
    });

    const high = dbThresholds.find((th) => th.riskLevel === RiskLevel.HIGH);
    if (high) highThreshold = Number(high.minOveragePoints);

    const med = dbThresholds.find((th) => th.riskLevel === RiskLevel.MEDIUM);
    if (med) mediumThreshold = Number(med.minOveragePoints);
  } catch (error) {
    console.warn("Could not query DB for risk score calculation, using defaults:", error);
  }

  const customerTierCeiling = tierCeilings[customerTier] ?? 15.0;

  // 2. Evaluate each line: Effective limit is the stricter (smaller) of tier and category ceilings
  let totalOveragePoints = 0;
  let worstLineOverage = 0;

  const evaluatedLines: LineEvaluationResult[] = lines.map((line) => {
    const catCeiling = categoryCeilings[line.category] ?? 10.0;
    const effectiveLimit = Math.min(customerTierCeiling, catCeiling);
    const overage = Math.max(0, Number((line.discountPercent - effectiveLimit).toFixed(2)));

    totalOveragePoints += overage;
    if (overage > worstLineOverage) {
      worstLineOverage = overage;
    }

    return {
      category: line.category,
      discountPercent: line.discountPercent,
      tierLimit: customerTierCeiling,
      categoryLimit: catCeiling,
      effectiveLimit,
      overagePoints: overage,
      status: overage > 0 ? `OVER (+${overage}pt)` : "OK",
    };
  });

  // 3. Determine Risk Level from DB-configured thresholds
  let riskLevel: RiskLevel = RiskLevel.LOW;
  let requiredApprovalPath = "NO_APPROVAL";

  if (totalOveragePoints >= highThreshold) {
    riskLevel = RiskLevel.HIGH;
    requiredApprovalPath = "SALES_MANAGER,FINANCE";
  } else if (totalOveragePoints >= mediumThreshold) {
    riskLevel = RiskLevel.MEDIUM;
    requiredApprovalPath = "SALES_MANAGER";
  }

  return {
    riskLevel,
    totalOveragePoints: Number(totalOveragePoints.toFixed(2)),
    worstLineOverage: Number(worstLineOverage.toFixed(2)),
    requiredApprovalPath,
    lines: evaluatedLines,
  };
}
