import { prisma } from "@/lib/prisma";
import { FulfillmentStatus, ProductCategory } from "@prisma/client";
import { calculateAvailableStock } from "@/lib/business-logic/stock-calculation";
import { calculateWarehouseSplit, WarehouseInventory } from "@/lib/business-logic/warehouse-split";

export interface StockTableItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  shippingCostWeight: number;
  productId: string;
  productName: string;
  category: ProductCategory;
  inStock: number;
  reserved: number;
  available: number;
}

export interface FulfillmentOrderItem {
  id: string;
  quotationId: string;
  displayCode: string;
  customerName: string;
  status: FulfillmentStatus;
  statusLabel: string;
  warehouses: string;
  totalQuantity: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
  shippingCostWeight: number;
}

export interface ProductOption {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
}

export interface FulfillmentScreenData {
  stockItems: StockTableItem[];
  awaitingOrders: FulfillmentOrderItem[];
  warehouses: WarehouseOption[];
  products: ProductOption[];
}

function formatWarehouseList(names: string[]): string {
  if (names.length === 0) return "Unassigned";
  // Format names nicely (e.g. "Main Warehouse" + "East Depot" -> "Main + East Depot" if preferred, or full names)
  const shortNames = names.map((n) => n.replace(/ Warehouse$/i, ""));
  return shortNames.join(" + ");
}

function formatStatusLabel(status: FulfillmentStatus): string {
  switch (status) {
    case FulfillmentStatus.SPLIT_PENDING:
      return "Split Pending";
    case FulfillmentStatus.BACKORDER:
      return "Backorder";
    case FulfillmentStatus.PENDING:
      return "Pending";
    case FulfillmentStatus.FULFILLED:
      return "Fulfilled";
    default:
      return status;
  }
}

/**
 * Loads stock levels, active fulfillment orders, warehouses, and product catalog
 * from PostgreSQL for Screen 7 (Fulfillment and Stock).
 */
export async function getFulfillmentScreenData(): Promise<FulfillmentScreenData> {
  try {
    const [dbWarehouses, dbProducts, dbStockLevels, dbFulfillments] = await Promise.all([
      prisma.warehouse.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isArchived: false },
        orderBy: { name: "asc" },
      }),
      prisma.stockLevel.findMany({
        include: {
          warehouse: true,
          product: true,
        },
        orderBy: [
          { warehouse: { name: "asc" } },
          { product: { name: "asc" } },
        ],
      }),
      prisma.fulfillment.findMany({
        where: {
          status: {
            in: [
              FulfillmentStatus.SPLIT_PENDING,
              FulfillmentStatus.BACKORDER,
              FulfillmentStatus.PENDING,
            ],
          },
        },
        include: {
          quotation: {
            include: {
              customer: true,
            },
          },
          lines: {
            include: {
              warehouse: true,
              product: true,
            },
          },
        },
        orderBy: {
          quotation: {
            displayCode: "desc",
          },
        },
      }),
    ]);

    // Format stock rows with strictly computed available stock
    const stockItems: StockTableItem[] = dbStockLevels.map((item) => {
      const inStock = item.inStock;
      const reserved = item.reserved;
      const available = calculateAvailableStock(inStock, reserved);

      return {
        id: item.id,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        shippingCostWeight: Number(item.warehouse.shippingCostWeight),
        productId: item.productId,
        productName: item.product.name,
        category: item.product.category,
        inStock,
        reserved,
        available,
      };
    });

    // Format fulfillment orders awaiting shipment
    const awaitingOrders: FulfillmentOrderItem[] = dbFulfillments.map((f) => {
      const warehouseNames = Array.from(
        new Set(f.lines.map((l) => l.warehouse?.name).filter((name): name is string => Boolean(name)))
      );
      const totalQuantity = f.lines.reduce((sum, l) => sum + l.quantityFulfilled, 0);

      return {
        id: f.id,
        quotationId: f.quotationId,
        displayCode: f.quotation.displayCode,
        customerName: f.quotation.customer.name,
        status: f.status,
        statusLabel: formatStatusLabel(f.status),
        warehouses: formatWarehouseList(warehouseNames),
        totalQuantity,
      };
    });

    const warehouses: WarehouseOption[] = dbWarehouses.map((w) => ({
      id: w.id,
      name: w.name,
      shippingCostWeight: Number(w.shippingCostWeight),
    }));

    const products: ProductOption[] = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
    }));

    return {
      stockItems,
      awaitingOrders,
      warehouses,
      products,
    };
  } catch (error) {
    console.error("Error loading fulfillment screen data from DB:", error);
    return {
      stockItems: [],
      awaitingOrders: [],
      warehouses: [],
      products: [],
    };
  }
}

export interface FulfillmentDetailAllocation {
  id?: string;
  warehouseId: string;
  warehouseName: string;
  quantityFulfilled: number;
  estimatedShipments: number;
  estimatedCost: number;
  isBackordered: boolean;
}

export interface FulfillmentDetailData {
  fulfillmentId: string;
  quotationId: string;
  displayCode: string;
  customerName: string;
  status: FulfillmentStatus;
  statusLabel: string;
  productName: string;
  productId: string;
  totalQuantity: number;
  allocations: FulfillmentDetailAllocation[];
  suggestedAllocations: FulfillmentDetailAllocation[];
  hasBackorder: boolean;
  canConsolidateBackorder: boolean;
  warehouses: WarehouseOption[];
}

/**
 * Loads detailed fulfillment allocation for Screen 8.
 * Resolves by Fulfillment.id, Quotation.displayCode, or Quotation.id.
 */
export async function getFulfillmentDetailData(
  idOrCode: string
): Promise<FulfillmentDetailData | null> {
  try {
    // 1. Find Fulfillment or Quotation
    let fulfillment = await prisma.fulfillment.findFirst({
      where: {
        OR: [
          { id: idOrCode },
          { quotationId: idOrCode },
          { quotation: { displayCode: idOrCode } },
        ],
      },
      include: {
        quotation: {
          include: {
            customer: true,
            orderLines: {
              include: { product: true },
            },
          },
        },
        lines: {
          include: {
            warehouse: true,
            product: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // If no fulfillment found, check if quotation exists and auto-create fulfillment
    if (!fulfillment) {
      const quotation = await prisma.quotation.findFirst({
        where: {
          OR: [{ id: idOrCode }, { displayCode: idOrCode }],
        },
        include: {
          customer: true,
          orderLines: {
            include: { product: true },
          },
        },
      });

      if (!quotation) {
        return null;
      }

      fulfillment = await prisma.fulfillment.create({
        data: {
          quotationId: quotation.id,
          status: FulfillmentStatus.SPLIT_PENDING,
        },
        include: {
          quotation: {
            include: {
              customer: true,
              orderLines: {
                include: { product: true },
              },
            },
          },
          lines: {
            include: {
              warehouse: true,
              product: true,
            },
          },
        },
      });
    }

    // 2. Determine target product and total quantity from order lines
    // Pick the primary physical product (e.g. Hardware) needing fulfillment
    const physicalLines = fulfillment.quotation.orderLines.filter(
      (l) => l.product.category === ProductCategory.HARDWARE
    );
    const primaryLine = physicalLines[0] || fulfillment.quotation.orderLines[0];

    // Total quantity to fulfill (from existing fulfillment lines or from order lines)
    const existingLinesSum = fulfillment.lines.reduce((s, l) => s + l.quantityFulfilled, 0);
    const orderLinesSum = primaryLine ? primaryLine.quantity : 1;
    const totalQuantity = existingLinesSum > 0 ? existingLinesSum : orderLinesSum;

    const productName = primaryLine?.product?.name || "Order Products";
    const productId = primaryLine?.productId || "";

    // 3. Fetch warehouses and live available stock for this product
    const allWarehouses = await prisma.warehouse.findMany({
      orderBy: { shippingCostWeight: "asc" },
    });

    const stockLevels = await prisma.stockLevel.findMany({
      where: productId ? { productId } : undefined,
    });

    const stockByWarehouse = new Map(
      stockLevels.map((s) => [s.warehouseId, calculateAvailableStock(s.inStock, s.reserved)])
    );

    const warehouseInventories: WarehouseInventory[] = allWarehouses.map((w) => ({
      warehouseId: w.id,
      warehouseName: w.name,
      shippingCostWeight: Number(w.shippingCostWeight),
      availableStock: stockByWarehouse.get(w.id) ?? 0,
    }));

    // 4. Compute suggested split using our pure Step 20 algorithm
    const splitComputation = calculateWarehouseSplit(totalQuantity, warehouseInventories);

    const suggestedAllocations: FulfillmentDetailAllocation[] = splitComputation.allocations.map(
      (a) => ({
        warehouseId: a.warehouseId,
        warehouseName: a.warehouseName,
        quantityFulfilled: a.quantityFulfilled,
        estimatedShipments: a.estimatedShipments,
        estimatedCost: a.estimatedCost,
        isBackordered: a.isBackordered,
      })
    );

    // 5. Current allocations from database (or suggested if none saved yet)
    let currentAllocations: FulfillmentDetailAllocation[] = [];
    if (fulfillment.lines.length > 0) {
      currentAllocations = fulfillment.lines.map((l) => ({
        id: l.id,
        warehouseId: l.warehouseId,
        warehouseName: l.warehouse.name,
        quantityFulfilled: l.quantityFulfilled,
        estimatedShipments: l.estimatedShipments,
        estimatedCost: Number(l.estimatedCost || 0),
        isBackordered: l.isBackordered,
      }));
    } else {
      currentAllocations = suggestedAllocations;
    }

    const hasBackorder = currentAllocations.some((l) => l.isBackordered);

    // Check if any warehouse now has stock to consolidate the backorder
    let canConsolidateBackorder = false;
    if (hasBackorder) {
      const backorderedQty = currentAllocations
        .filter((l) => l.isBackordered)
        .reduce((sum, l) => sum + l.quantityFulfilled, 0);

      canConsolidateBackorder = warehouseInventories.some(
        (w) => w.availableStock >= backorderedQty
      );
    }

    const warehouses: WarehouseOption[] = allWarehouses.map((w) => ({
      id: w.id,
      name: w.name,
      shippingCostWeight: Number(w.shippingCostWeight),
    }));

    return {
      fulfillmentId: fulfillment.id,
      quotationId: fulfillment.quotationId,
      displayCode: fulfillment.quotation.displayCode,
      customerName: fulfillment.quotation.customer.name,
      status: fulfillment.status,
      statusLabel: formatStatusLabel(fulfillment.status),
      productName,
      productId,
      totalQuantity,
      allocations: currentAllocations,
      suggestedAllocations,
      hasBackorder,
      canConsolidateBackorder,
      warehouses,
    };
  } catch (err) {
    console.error("Error loading fulfillment detail data:", err);
    return null;
  }
}
