/**
 * DealFlow360 — Proration Logic (Step 23)
 *
 * Rule:
 * When a customer upgrades/modifies or cancels a recurring subscription mid-cycle,
 * we prorate based on the exact remaining days in the cycle.
 *
 * Formula:
 * Proration Charge = (newPrice - oldPrice) * (daysRemaining / totalDaysInCycle)
 *
 * Worked Example from project.md:
 * - Current plan: $46/month (30-day month)
 * - Upgrades to: $76/month on Day 15
 * - Difference: $76 - $46 = $30
 * - Days Remaining: 30 - 15 = 15
 * - Fraction: 15 / 30 = 0.5
 * - Extra charge for remainder of cycle: $30 * 0.5 = $15.00
 */

export interface ProrationResult {
  priceDifference: number;
  totalDaysInCycle: number;
  daysRemaining: number;
  prorationFraction: number;
  proratedCharge: number;
  explanation: string;
}

export interface CancellationCreditResult {
  planPrice: number;
  totalDaysInCycle: number;
  daysRemaining: number;
  prorationFraction: number;
  creditAmount: number;
  explanation: string;
}

/**
 * Calculates the prorated charge when modifying a plan mid-cycle.
 *
 * @param oldPrice Current cycle price (e.g. 46)
 * @param newPrice New cycle price (e.g. 76)
 * @param totalDaysInCycle Total days in cycle (usually 30 for monthly, 90 for quarterly, 365 for annual)
 * @param daysRemaining Days left until next renewal date (e.g. 15)
 */
export function calculateProrationCharge(
  oldPrice: number,
  newPrice: number,
  totalDaysInCycle: number = 30,
  daysRemaining: number = 15
): ProrationResult {
  // Safety checks
  const safeTotalDays = Math.max(1, totalDaysInCycle);
  const safeDaysRemaining = Math.max(0, Math.min(safeTotalDays, daysRemaining));

  // Difference in price
  const priceDifference = Number((newPrice - oldPrice).toFixed(2));

  // Fraction of cycle left
  const prorationFraction = safeDaysRemaining / safeTotalDays;

  // Prorated charge
  const proratedCharge = Number((priceDifference * prorationFraction).toFixed(2));

  const explanation =
    `($${newPrice.toFixed(2)} - $${oldPrice.toFixed(2)}) × (${safeDaysRemaining} / ${safeTotalDays}) = $${proratedCharge.toFixed(2)}`;

  return {
    priceDifference,
    totalDaysInCycle: safeTotalDays,
    daysRemaining: safeDaysRemaining,
    prorationFraction: Number(prorationFraction.toFixed(4)),
    proratedCharge,
    explanation,
  };
}

/**
 * Calculates the refund credit note when cancelling a pre-paid subscription mid-cycle.
 *
 * @param currentPrice Current cycle price paid upfront (e.g. 46)
 * @param totalDaysInCycle Total days in cycle (e.g. 30)
 * @param daysRemaining Unused days remaining (e.g. 15)
 */
export function calculateCancellationCredit(
  currentPrice: number,
  totalDaysInCycle: number = 30,
  daysRemaining: number = 15
): CancellationCreditResult {
  const safeTotalDays = Math.max(1, totalDaysInCycle);
  const safeDaysRemaining = Math.max(0, Math.min(safeTotalDays, daysRemaining));

  const prorationFraction = safeDaysRemaining / safeTotalDays;
  const creditAmount = Number((currentPrice * prorationFraction).toFixed(2));

  const explanation =
    `$${currentPrice.toFixed(2)} × (${safeDaysRemaining} / ${safeTotalDays}) = $${creditAmount.toFixed(2)} credit`;

  return {
    planPrice: currentPrice,
    totalDaysInCycle: safeTotalDays,
    daysRemaining: safeDaysRemaining,
    prorationFraction: Number(prorationFraction.toFixed(4)),
    creditAmount,
    explanation,
  };
}
