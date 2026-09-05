import { CustomerTier, ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface DiscountCeilingMap {
  tiers: Record<CustomerTier, number>;
  categories: Record<ProductCategory, number>;
}

// Canonical default ceilings per project.md Part 2.5 & 2.6
export const DEFAULT_DISCOUNT_CEILINGS: DiscountCeilingMap = {
  tiers: {
    BRONZE: 5.0,
    SILVER: 10.0,
    GOLD: 15.0,
  },
  categories: {
    HARDWARE: 15.0,
    SERVICES: 10.0,
    SUBSCRIPTION: 15.0,
  },
};

export interface LineDiscountLimitInput {
  customerTier: CustomerTier;
  productCategory: ProductCategory;
  discountPercent: number;
  ceilings?: DiscountCeilingMap;
}

export interface LineDiscountLimitResult {
  tierCeiling: number;
  categoryCeiling: number;
  effectiveLimitPercent: number; // Math.min(tierCeiling, categoryCeiling)
  discountPercent: number;
  status: "OK" | "OVER";
  isOverLimit: boolean;
  overagePoints: number; // Math.max(0, discountPercent - effectiveLimitPercent)
  statusBadgeText: string; // "OK" or "OVER (+8pt)"
  stricterConstraint: "TIER" | "CATEGORY" | "EQUAL";
}

/**
 * Pure calculation function for evaluating per-line discount limits.
 * Applies the core rule: The stricter (smaller) of Customer Tier Ceiling
 * and Product Category Ceiling wins as that line's effective discount limit.
 */
export function calculateLineDiscountLimit({
  customerTier,
  productCategory,
  discountPercent,
  ceilings = DEFAULT_DISCOUNT_CEILINGS,
}: LineDiscountLimitInput): LineDiscountLimitResult {
  const tierCeiling = ceilings.tiers[customerTier] ?? DEFAULT_DISCOUNT_CEILINGS.tiers[customerTier];
  const categoryCeiling = ceilings.categories[productCategory] ?? DEFAULT_DISCOUNT_CEILINGS.categories[productCategory];

  // The stricter (smaller) number becomes this line's Effective Limit
  const effectiveLimitPercent = Math.min(tierCeiling, categoryCeiling);

  const roundedDiscount = Math.round(discountPercent * 100) / 100;
  const isOverLimit = roundedDiscount > effectiveLimitPercent;
  const overagePoints = isOverLimit ? Math.round((roundedDiscount - effectiveLimitPercent) * 100) / 100 : 0;

  let stricterConstraint: "TIER" | "CATEGORY" | "EQUAL" = "EQUAL";
  if (tierCeiling < categoryCeiling) {
    stricterConstraint = "TIER";
  } else if (categoryCeiling < tierCeiling) {
    stricterConstraint = "CATEGORY";
  }

  const status: "OK" | "OVER" = isOverLimit ? "OVER" : "OK";
  const statusBadgeText = isOverLimit ? `OVER (+${overagePoints}pt)` : "OK";

  return {
    tierCeiling,
    categoryCeiling,
    effectiveLimitPercent,
    discountPercent: roundedDiscount,
    status,
    isOverLimit,
    overagePoints,
    statusBadgeText,
    stricterConstraint,
  };
}

/**
 * Fetches configured discount ceilings from PostgreSQL database.
 * Falls back to canonical defaults if tables are empty or unreachable.
 */
export async function getDiscountCeilings(): Promise<DiscountCeilingMap> {
  try {
    const [tierRows, categoryRows] = await Promise.all([
      prisma.tierDiscountCeiling.findMany(),
      prisma.categoryDiscountCeiling.findMany(),
    ]);

    const tiers = { ...DEFAULT_DISCOUNT_CEILINGS.tiers };
    for (const row of tierRows) {
      tiers[row.tier] = Number(row.maxDiscountPercent);
    }

    const categories = { ...DEFAULT_DISCOUNT_CEILINGS.categories };
    for (const row of categoryRows) {
      categories[row.category] = Number(row.maxDiscountPercent);
    }

    return { tiers, categories };
  } catch (error) {
    console.warn("Failed to fetch dynamic ceilings from database, using canonical defaults.", error);
    return DEFAULT_DISCOUNT_CEILINGS;
  }
}
