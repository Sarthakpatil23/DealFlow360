/**
 * Smart Upsell & Cross-Sell Recommendation Engine
 * Strictly adheres to project.md Part 3 Screen 4:
 * - Ranked using database UpsellRules and co-purchase heuristics
 * - Only suggests products not currently in the active cart
 * - Promoted products rank higher with "Promo" badge
 * - Margin boosters and subscription plans highlighted
 * - Supports session-level dismissals
 */

export interface UpsellRuleData {
  id: string;
  baseProductId: string;
  baseProductName?: string;
  suggestedProductId: string;
  suggestedProductName?: string;
  isPromoted: boolean;
  minMarginThreshold: number;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  category: string;
  basePrice: number;
}

export interface CartLineSummary {
  productId?: string;
  productName: string;
  category?: string;
}

export interface DynamicUpsellSuggestion {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  badge: string;
  badgeType: "promo" | "margin" | "subscription" | "copurchase";
  reason: string;
  marginBoostText: string;
  isSubscription: boolean;
}

interface GenerateUpsellOptions {
  cartLines: CartLineSummary[];
  allProducts: CatalogProductSummary[];
  upsellRules?: UpsellRuleData[];
  dismissedProductNames?: string[];
  maxSuggestions?: number;
}

export function getDynamicUpsellSuggestions({
  cartLines,
  allProducts,
  upsellRules = [],
  dismissedProductNames = [],
  maxSuggestions = 3,
}: GenerateUpsellOptions): DynamicUpsellSuggestion[] {
  if (!allProducts || allProducts.length === 0) return [];

  // 1. Build lookup sets for existing cart items and dismissed items (case-insensitive)
  const cartProductNames = new Set(
    cartLines.map((l) => l.productName.trim().toLowerCase())
  );
  const cartProductIds = new Set(
    cartLines.map((l) => l.productId).filter(Boolean) as string[]
  );

  const dismissedSet = new Set(
    dismissedProductNames.map((n) => n.trim().toLowerCase())
  );

  // Helper to check if a product is eligible for suggestion
  const isAvailableForUpsell = (product: CatalogProductSummary) => {
    const normName = product.name.trim().toLowerCase();
    if (cartProductNames.has(normName)) return false;
    if (cartProductIds.has(product.id)) return false;
    if (dismissedSet.has(normName)) return false;
    return true;
  };

  const eligibleProducts = allProducts.filter(isAvailableForUpsell);
  if (eligibleProducts.length === 0) return [];

  const suggestions: DynamicUpsellSuggestion[] = [];
  const addedProductNames = new Set<string>();

  // Helper to safely add a candidate
  const addCandidate = (
    product: CatalogProductSummary,
    badge: string,
    badgeType: DynamicUpsellSuggestion["badgeType"],
    reason: string,
    marginBoostText: string,
    isSubscription: boolean = product.category.toUpperCase() === "SUBSCRIPTION"
  ) => {
    const norm = product.name.trim().toLowerCase();
    if (addedProductNames.has(norm) || !isAvailableForUpsell(product)) return false;

    addedProductNames.add(norm);
    suggestions.push({
      id: product.id,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice,
      badge,
      badgeType,
      reason,
      marginBoostText,
      isSubscription,
    });
    return true;
  };

  // 2. CHECK 1: Database UpsellRules matching items in the cart
  // Sort rules so promoted rules come first
  const sortedRules = [...upsellRules].sort((a, b) => {
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;
    return b.minMarginThreshold - a.minMarginThreshold;
  });

  for (const rule of sortedRules) {
    const isBaseInCart =
      cartProductIds.has(rule.baseProductId) ||
      cartLines.some(
        (l) =>
          rule.baseProductName &&
          l.productName.toLowerCase() === rule.baseProductName.toLowerCase()
      );

    if (isBaseInCart) {
      const suggestedProd = eligibleProducts.find(
        (p) =>
          p.id === rule.suggestedProductId ||
          (rule.suggestedProductName &&
            p.name.toLowerCase() === rule.suggestedProductName.toLowerCase())
      );

      if (suggestedProd) {
        const baseName =
          rule.baseProductName ||
          cartLines.find((l) => l.productId === rule.baseProductId)?.productName ||
          "device";

        const badge = rule.isPromoted
          ? "Promo: 12% off"
          : rule.minMarginThreshold > 0
          ? `+$${rule.minMarginThreshold.toFixed(0)} Margin Booster`
          : suggestedProd.category === "SUBSCRIPTION"
          ? `+$${suggestedProd.basePrice.toFixed(0)}/mo Recurring`
          : "Recommended Companion";

        const badgeType = rule.isPromoted
          ? "promo"
          : rule.minMarginThreshold > 0
          ? "margin"
          : suggestedProd.category === "SUBSCRIPTION"
          ? "subscription"
          : "copurchase";

        const reason = rule.isPromoted
          ? `Promotional bundle discount when purchased with ${baseName}.`
          : `High-synergy companion frequently co-purchased with ${baseName}.`;

        addCandidate(
          suggestedProd,
          badge,
          badgeType,
          reason,
          `+$${rule.minMarginThreshold.toFixed(0)} Margin`
        );
      }
    }
  }

  // 3. CHECK 2: Category & Product Co-purchase Heuristics based on Cart Contents
  const hasLaptop = cartLines.some((l) =>
    /laptop|ultrabook|macbook|notebook/i.test(l.productName)
  );
  const hasDisplay = cartLines.some((l) =>
    /display|monitor|screen/i.test(l.productName)
  );
  const hasHardware = cartLines.some((l) =>
    l.category === "HARDWARE" || /laptop|ultrabook|display|station|mouse/i.test(l.productName)
  );
  const hasServices = cartLines.some((l) =>
    l.category === "SERVICES" || /setup|migration|service/i.test(l.productName)
  );
  const hasSubscription = cartLines.some((l) =>
    l.category === "SUBSCRIPTION" || /care plan|sla|backup/i.test(l.productName)
  );

  // A) Laptop in cart -> suggest Docking Station, Studio Display, Wireless Mouse, Care Plan
  if (hasLaptop) {
    const dock = eligibleProducts.find((p) => /docking/i.test(p.name));
    if (dock) {
      addCandidate(
        dock,
        "Promo: 12% off",
        "promo",
        "Thunderbolt 4 dual 4K display hub. Essential for workstation setups.",
        "+$28 Margin"
      );
    }

    const mouse = eligibleProducts.find((p) => /mouse/i.test(p.name));
    if (mouse) {
      addCandidate(
        mouse,
        "+$18 Margin Booster",
        "margin",
        "Ergonomic high-precision optical mouse. 85% companion attach rate.",
        "+$18 Margin"
      );
    }

    const carePlan = eligibleProducts.find((p) => /care plan/i.test(p.name));
    if (carePlan) {
      addCandidate(
        carePlan,
        "+$46 Monthly Recurring",
        "subscription",
        "24/7 enterprise SLA hardware support with next-day replacement guarantee.",
        "+$46 Margin/mo",
        true
      );
    }

    const display = eligibleProducts.find((p) => /display|monitor/i.test(p.name));
    if (display) {
      addCandidate(
        display,
        "Bundle Special",
        "copurchase",
        "Color-accurate IPS display with single-cable Thunderbolt daisy-chaining.",
        "+$60 Margin"
      );
    }
  }

  // B) Display in cart -> suggest Docking Station or Setup Service
  if (hasDisplay) {
    const dock = eligibleProducts.find((p) => /docking/i.test(p.name));
    if (dock) {
      addCandidate(
        dock,
        "Promo: 12% off",
        "promo",
        "Dual 4K Thunderbolt 4 hub for multi-monitor display outputs.",
        "+$28 Margin"
      );
    }

    const setup = eligibleProducts.find((p) => /setup/i.test(p.name));
    if (setup) {
      addCandidate(
        setup,
        "+$45 Margin Booster",
        "margin",
        "Onsite desk cabling, ergonomic positioning, and driver calibration.",
        "+$45 Margin"
      );
    }
  }

  // C) Hardware without Services -> suggest Setup Service or Extended Warranty
  if (hasHardware && !hasServices) {
    const setup = eligibleProducts.find((p) => /setup/i.test(p.name));
    if (setup) {
      addCandidate(
        setup,
        "+$50 Margin Booster",
        "margin",
        "Complete enterprise workstation onboarding and image deployment.",
        "+$50 Margin"
      );
    }

    const warranty = eligibleProducts.find((p) => /warranty/i.test(p.name));
    if (warranty) {
      addCandidate(
        warranty,
        "Protection Plan",
        "copurchase",
        "3-year advance hardware replacement coverage and accidental damage protection.",
        "+$35 Margin"
      );
    }
  }

  // D) Hardware without Subscription -> suggest Cloud Backup or Care Plan
  if (hasHardware && !hasSubscription) {
    const backup = eligibleProducts.find((p) => /backup/i.test(p.name));
    if (backup) {
      addCandidate(
        backup,
        "+$85 Monthly Recurring",
        "subscription",
        "Continuous endpoint snapshot backup and automated ransomware recovery.",
        "+$85 Margin/mo",
        true
      );
    }

    const sla = eligibleProducts.find((p) => /sla/i.test(p.name));
    if (sla) {
      addCandidate(
        sla,
        "+$300 Quarterly SLA",
        "subscription",
        "Dedicated technical account manager with 1hr critical response guarantee.",
        "+$300 Margin/qtr",
        true
      );
    }
  }

  // 4. CHECK 3: Fallback / Empty Cart defaults
  // If cart is empty or we still need suggestions, fill with top margin/promo catalog items
  if (suggestions.length < maxSuggestions) {
    const remainingEligible = eligibleProducts.filter(
      (p) => !addedProductNames.has(p.name.trim().toLowerCase())
    );

    // Prioritize high value / recurring items
    const sortedRemaining = [...remainingEligible].sort((a, b) => {
      if (a.category === "SUBSCRIPTION" && b.category !== "SUBSCRIPTION") return -1;
      if (b.category === "SUBSCRIPTION" && a.category !== "SUBSCRIPTION") return 1;
      return b.basePrice - a.basePrice;
    });

    for (const prod of sortedRemaining) {
      if (suggestions.length >= maxSuggestions) break;

      const isSub = prod.category.toUpperCase() === "SUBSCRIPTION";
      const badge = isSub
        ? `+$${prod.basePrice.toFixed(0)} Recurring`
        : prod.basePrice > 200
        ? "Popular Enterprise Add-on"
        : "+$18 Margin Booster";

      const badgeType: DynamicUpsellSuggestion["badgeType"] = isSub
        ? "subscription"
        : "copurchase";

      addCandidate(
        prod,
        badge,
        badgeType,
        `Frequently selected by enterprise clients across recent orders.`,
        isSub ? `+$${prod.basePrice.toFixed(0)}/mo` : `+${(prod.basePrice * 0.3).toFixed(0)} Margin`,
        isSub
      );
    }
  }

  return suggestions.slice(0, maxSuggestions);
}
