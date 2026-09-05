import { prisma } from "@/lib/prisma";
import { FulfillmentStatus, ProductCategory } from "@prisma/client";
import { calculateAvailableStock } from "@/lib/business-logic/stock-calculation";

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
