export interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  shippingCostWeight: number;
  availableStock: number;  
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

export function calculateWarehouseSplit( requestedQuantity: number,warehouses: WarehouseInventory[]): WarehouseSplitResult {
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

  //sorted by cheapest cosst of shipping
  const sortedWarehouses = [...warehouses].sort((a, b) => a.shippingCostWeight - b.shippingCostWeight);

  //can one full-fill the order
  const singleWarehouseMatch = sortedWarehouses.find((w) => w.availableStock >= needed);

  if (singleWarehouseMatch) {
    //final cose of shipment
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

  // take as much as possible from the cheapest warehouse, then move to the next.
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

// not fulfilled from any warehouse is marked as a Backorder.
  const backorderedQuantity = remainingNeeded;

  if (backorderedQuantity > 0) {
    // the first one in array gets that
    const fallbackWarehouse = sortedWarehouses[0];

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
