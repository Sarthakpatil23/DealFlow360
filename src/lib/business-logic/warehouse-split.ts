/**
 * Pure Warehouse Split Business Logic (Step 20).
 *
 * Strictly adheres to project.md Screen 8 rules:
 * 1. Look at total quantity needed for the product.
 * 2. Try to fulfill entirely from a single warehouse first, preferring the warehouse
 *    with the lowest shipping-cost weight to minimize shipments and cost.
 * 3. If no single warehouse has enough Available stock (inStock - reserved), split:
 *    pull as much as possible from the cheapest warehouse, then the next, until covered.
 * 4. Anything still short becomes a Backorder line.
 */

export interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  shippingCostWeight: number; // Lower weight = cheaper / preferred
  availableStock: number;     // Strictly inStock - reserved
}

export interface SplitLineAllocation {
  warehouseId: string;
  warehouseName: string;
  quantityFulfilled: number;
  estimatedShipments: number;
  estimatedCost: number;
  isBackordered: boolean;
}

export interface WarehouseSplitResult {
  requestedQuantity: number;
  totalFulfilled: number;
  backorderedQuantity: number;
  status: "FULLY_FULFILLED" | "SPLIT_PENDING" | "BACKORDER";
  allocations: SplitLineAllocation[];
}

/**
 * Calculates how to split requested units across warehouses.
 * Beginner-friendly and easy to explain step-by-step.
 */
export function calculateWarehouseSplit(
  requestedQuantity: number,
  warehouses: WarehouseInventory[]
): WarehouseSplitResult {
  const needed = Math.max(0, Math.floor(requestedQuantity));

  if (needed === 0) {
    return {
      requestedQuantity: 0,
      totalFulfilled: 0,
      backorderedQuantity: 0,
      status: "FULLY_FULFILLED",
      allocations: [],
    };
  }

  // Sort warehouses by shippingCostWeight ascending (cheapest / preferred first)
  const sortedWarehouses = [...warehouses].sort(
    (a, b) => a.shippingCostWeight - b.shippingCostWeight
  );

  // STEP 1: Can ANY single warehouse fulfill 100% of the order?
  // If yes, we pick the cheapest one that has enough stock to avoid unnecessary splitting.
  const singleWarehouseMatch = sortedWarehouses.find(
    (w) => w.availableStock >= needed
  );

  if (singleWarehouseMatch) {
    const cost = Number((needed * singleWarehouseMatch.shippingCostWeight).toFixed(2));
    return {
      requestedQuantity: needed,
      totalFulfilled: needed,
      backorderedQuantity: 0,
      status: "FULLY_FULFILLED",
      allocations: [
        {
          warehouseId: singleWarehouseMatch.warehouseId,
          warehouseName: singleWarehouseMatch.warehouseName,
          quantityFulfilled: needed,
          estimatedShipments: 1,
          estimatedCost: cost,
          isBackordered: false,
        },
      ],
    };
  }

  // STEP 2: No single warehouse has enough available stock.
  // We split: take as much as possible from the cheapest warehouse, then move to the next.
  let remainingNeeded = needed;
  const allocations: SplitLineAllocation[] = [];

  for (const warehouse of sortedWarehouses) {
    if (remainingNeeded <= 0) break;

    // Take as much available stock as this warehouse has (up to what we still need)
    const canTake = Math.min(warehouse.availableStock, remainingNeeded);

    if (canTake > 0) {
      const cost = Number((canTake * warehouse.shippingCostWeight).toFixed(2));
      allocations.push({
        warehouseId: warehouse.warehouseId,
        warehouseName: warehouse.warehouseName,
        quantityFulfilled: canTake,
        estimatedShipments: 1,
        estimatedCost: cost,
        isBackordered: false,
      });

      remainingNeeded -= canTake;
    }
  }

  // STEP 3: Check if there is still an unfulfilled remainder.
  // Any quantity that could NOT be fulfilled from any warehouse is marked as a Backorder.
  const backorderedQuantity = remainingNeeded;

  if (backorderedQuantity > 0) {
    // Assign backorder to the primary/first warehouse for restock tracking
    const fallbackWarehouse = sortedWarehouses[0] || {
      warehouseId: "unassigned",
      warehouseName: "Primary Warehouse",
      shippingCostWeight: 1.0,
    };

    allocations.push({
      warehouseId: fallbackWarehouse.warehouseId,
      warehouseName: `${fallbackWarehouse.warehouseName} (Backorder)`,
      quantityFulfilled: backorderedQuantity,
      estimatedShipments: 1,
      estimatedCost: 0,
      isBackordered: true,
    });
  }

  // STEP 4: Determine overall status label
  const totalFulfilled = needed - backorderedQuantity;
  let status: "FULLY_FULFILLED" | "SPLIT_PENDING" | "BACKORDER" = "FULLY_FULFILLED";

  if (backorderedQuantity > 0) {
    status = "BACKORDER";
  } else if (allocations.length > 1) {
    status = "SPLIT_PENDING";
  }

  return {
    requestedQuantity: needed,
    totalFulfilled,
    backorderedQuantity,
    status,
    allocations,
  };
}
