import { prisma } from "@/lib/prisma";
import { CustomerTier, ProductCategory, RiskLevel } from "@prisma/client";

export interface TierCeilingItem {
  id?: string;
  tier: CustomerTier;
  label: string;
  maxDiscountPercent: number;
}

export interface CategoryCeilingItem {
  id?: string;
  category: ProductCategory;
  label: string;
  maxDiscountPercent: number;
}

export interface ApprovalThresholdItem {
  id?: string;
  riskLevel: RiskLevel;
  rangeLabel: string;
  whoApproves: string;
  minOveragePoints: number;
}

export interface ConfigAuditItem {
  id: string;
  actorName: string;
  note: string;
  createdAt: string;
}

export interface DiscountConfigData {
  tierCeilings: TierCeilingItem[];
  categoryCeilings: CategoryCeilingItem[];
  approvalThresholds: ApprovalThresholdItem[];
  recentAuditLogs: ConfigAuditItem[];
}

/**
 * Fetches the current live discount ceilings and approval chain thresholds from PostgreSQL.
 * Strictly adheres to project.md Screen 18 and screen18.png.
 */
export async function getDiscountConfigData(): Promise<DiscountConfigData> {
  // Default spec fallbacks per project.md Screen 18 & screen18.png
  let tierCeilings: TierCeilingItem[] = [
    { tier: CustomerTier.BRONZE, label: "Bronze", maxDiscountPercent: 5.0 },
    { tier: CustomerTier.SILVER, label: "Silver", maxDiscountPercent: 10.0 },
    { tier: CustomerTier.GOLD, label: "Gold", maxDiscountPercent: 15.0 },
  ];

  let categoryCeilings: CategoryCeilingItem[] = [
    { category: ProductCategory.HARDWARE, label: "Hardware", maxDiscountPercent: 15.0 },
    { category: ProductCategory.SERVICES, label: "Services", maxDiscountPercent: 10.0 },
    { category: ProductCategory.SUBSCRIPTION, label: "Subscription", maxDiscountPercent: 15.0 },
  ];

  let approvalThresholds: ApprovalThresholdItem[] = [
    {
      riskLevel: RiskLevel.LOW,
      rangeLabel: "Within tier/Category limit",
      whoApproves: "No approval needed",
      minOveragePoints: 0.0,
    },
    {
      riskLevel: RiskLevel.MEDIUM,
      rangeLabel: "Over limit, blended risk medium",
      whoApproves: "Sales manager",
      minOveragePoints: 0.01,
    },
    {
      riskLevel: RiskLevel.HIGH,
      rangeLabel: "Over limit, blended high risk",
      whoApproves: "Sales manager then finance",
      minOveragePoints: 8.0,
    },
  ];

  let recentAuditLogs: ConfigAuditItem[] = [];

  try {
    const [dbTiers, dbCategories, dbThresholds, dbAudits] = await Promise.all([
      prisma.tierDiscountCeiling.findMany(),
      prisma.categoryDiscountCeiling.findMany(),
      prisma.approvalChainThreshold.findMany({ orderBy: { minOveragePoints: "asc" } }),
      prisma.auditLogEntry.findMany({
        where: { action: "CONFIG_CHANGED" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { actorUser: true },
      }),
    ]);

    if (dbTiers.length > 0) {
      const tierMap: Record<CustomerTier, { id: string; percent: number }> = {} as any;
      dbTiers.forEach((t) => {
        tierMap[t.tier] = { id: t.id, percent: Number(t.maxDiscountPercent) };
      });

      tierCeilings = [
        {
          id: tierMap[CustomerTier.BRONZE]?.id,
          tier: CustomerTier.BRONZE,
          label: "Bronze",
          maxDiscountPercent: tierMap[CustomerTier.BRONZE]?.percent ?? 5.0,
        },
        {
          id: tierMap[CustomerTier.SILVER]?.id,
          tier: CustomerTier.SILVER,
          label: "Silver",
          maxDiscountPercent: tierMap[CustomerTier.SILVER]?.percent ?? 10.0,
        },
        {
          id: tierMap[CustomerTier.GOLD]?.id,
          tier: CustomerTier.GOLD,
          label: "Gold",
          maxDiscountPercent: tierMap[CustomerTier.GOLD]?.percent ?? 15.0,
        },
      ];
    }

    if (dbCategories.length > 0) {
      const catMap: Record<ProductCategory, { id: string; percent: number }> = {} as any;
      dbCategories.forEach((c) => {
        catMap[c.category] = { id: c.id, percent: Number(c.maxDiscountPercent) };
      });

      categoryCeilings = [
        {
          id: catMap[ProductCategory.HARDWARE]?.id,
          category: ProductCategory.HARDWARE,
          label: "Hardware",
          maxDiscountPercent: catMap[ProductCategory.HARDWARE]?.percent ?? 15.0,
        },
        {
          id: catMap[ProductCategory.SERVICES]?.id,
          category: ProductCategory.SERVICES,
          label: "Services",
          maxDiscountPercent: catMap[ProductCategory.SERVICES]?.percent ?? 10.0,
        },
        {
          id: catMap[ProductCategory.SUBSCRIPTION]?.id,
          category: ProductCategory.SUBSCRIPTION,
          label: "Subscription",
          maxDiscountPercent: catMap[ProductCategory.SUBSCRIPTION]?.percent ?? 15.0,
        },
      ];
    }

    if (dbThresholds.length > 0) {
      const med = dbThresholds.find((t) => t.riskLevel === RiskLevel.MEDIUM);
      const high = dbThresholds.find((t) => t.riskLevel === RiskLevel.HIGH);

      approvalThresholds = [
        {
          riskLevel: RiskLevel.LOW,
          rangeLabel: "Within tier/Category limit",
          whoApproves: "No approval needed",
          minOveragePoints: 0.0,
        },
        {
          id: med?.id,
          riskLevel: RiskLevel.MEDIUM,
          rangeLabel: "Over limit, blended risk medium",
          whoApproves: med?.requiredApprovalPath === "SALES_MANAGER" ? "Sales manager" : med?.requiredApprovalPath || "Sales manager",
          minOveragePoints: med ? Number(med.minOveragePoints) : 0.01,
        },
        {
          id: high?.id,
          riskLevel: RiskLevel.HIGH,
          rangeLabel: "Over limit, blended high risk",
          whoApproves:
            high?.requiredApprovalPath.includes("FINANCE")
              ? "Sales manager then finance"
              : high?.requiredApprovalPath || "Sales manager then finance",
          minOveragePoints: high ? Number(high.minOveragePoints) : 8.0,
        },
      ];
    }

    if (dbAudits.length > 0) {
      recentAuditLogs = dbAudits.map((a) => ({
        id: a.id,
        actorName: a.actorUser?.name || "Administrator",
        note: a.note || "Configuration updated",
        createdAt: a.createdAt.toISOString(),
      }));
    }
  } catch (error) {
    console.warn("Could not query DB for discount config data, using defaults:", error);
  }

  return {
    tierCeilings,
    categoryCeilings,
    approvalThresholds,
    recentAuditLogs,
  };
}
