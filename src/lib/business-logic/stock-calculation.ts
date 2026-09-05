/**
 * Pure stock calculation business logic.
 * Strictly adheres to project.md Part 2.10 and Screen 7 rules:
 * - In Stock: raw physical inventory count
 * - Reserved: stock promised to unconfirmed/confirmed orders
 * - Available = In Stock - Reserved (the number usable for new fulfillment decisions)
 *
 * Available stock is strictly derived and NEVER hardcoded or stored as a static field.
 */

export interface StockCalculationInput {
  inStock: number;
  reserved: number;
}

export interface StockCalculationResult {
  inStock: number;
  reserved: number;
  available: number;
  isAvailableDepleted: boolean;
  isAvailableNegative: boolean;
}

/**
 * Derives available stock strictly from in-stock minus reserved.
 */
export function calculateAvailableStock(inStock: number, reserved: number): number {
  const stock = Number(inStock) || 0;
  const res = Number(reserved) || 0;
  return stock - res;
}

/**
 * Computes full stock metrics and flags.
 */
export function computeStockMetrics(input: StockCalculationInput): StockCalculationResult {
  const available = calculateAvailableStock(input.inStock, input.reserved);
  return {
    inStock: input.inStock,
    reserved: input.reserved,
    available,
    isAvailableDepleted: available === 0,
    isAvailableNegative: available < 0,
  };
}
