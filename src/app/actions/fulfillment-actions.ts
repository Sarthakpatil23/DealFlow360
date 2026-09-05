"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FulfillmentStatus } from "@prisma/client";
import { calculateAvailableStock } from "@/lib/business-logic/stock-calculation";

export interface CreateWarehouseInput {
  name: string;
  shippingCostWeight?: number;
}

export interface CreateWarehouseResult {
  success: boolean;
  warehouse?: {
    id: string;
    name: string;
    shippingCostWeight: number;
  };
  error?: string;
}

export interface SetStockLevelInput {
  warehouseId: string;
  productId: string;
  inStock: number;
  reserved?: number;
}

export interface SetStockLevelResult {
  success: boolean;
  stockLevel?: {
    id: string;
    warehouseId: string;
    productId: string;
    inStock: number;
    reserved: number;
    available: number;
  };
  message?: string;
  error?: string;
}

/**
 * Creates a new Warehouse record with a name and shipping-cost weight.
 */
export async function createWarehouseAction(
  input: CreateWarehouseInput
): Promise<CreateWarehouseResult> {
  try {
    const name = input.name?.trim();
    if (!name) {
      return { success: false, error: "Warehouse name is required." };
    }

    const weight = Number(input.shippingCostWeight);
    const shippingCostWeight = !isNaN(weight) && weight > 0 ? weight : 1.0;

    // Check if warehouse already exists by name
    const existing = await prisma.warehouse.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return {
        success: true,
        warehouse: {
          id: existing.id,
          name: existing.name,
          shippingCostWeight: Number(existing.shippingCostWeight),
        },
      };
    }

    const created = await prisma.warehouse.create({
      data: {
        name,
        shippingCostWeight,
      },
    });

    try {
      revalidatePath("/fulfillment");
      revalidatePath("/dashboard");
    } catch {
      // Ignored in non-HTTP / CLI contexts
    }

    return {
      success: true,
      warehouse: {
        id: created.id,
        name: created.name,
        shippingCostWeight: Number(created.shippingCostWeight),
      },
    };
  } catch (error: any) {
    console.error("Failed to create warehouse:", error);
    return {
      success: false,
      error: error.message || "Failed to create warehouse.",
    };
  }
}

/**
 * Upserts the stock level for a product in a warehouse.
 * Computes available stock strictly as (inStock - reserved).
 * Also synchronizes the product's aggregate quantityOnHand.
 */
export async function setStockLevelAction(
  input: SetStockLevelInput
): Promise<SetStockLevelResult> {
  try {
    const { warehouseId, productId } = input;
    if (!warehouseId || !productId) {
      return { success: false, error: "Warehouse and Product are both required." };
    }

    const inStock = Math.max(0, Math.floor(Number(input.inStock) || 0));

    // Verify warehouse and product exist
    const [warehouse, product] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: warehouseId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!warehouse) {
      return { success: false, error: "Selected warehouse does not exist." };
    }
    if (!product) {
      return { success: false, error: "Selected product does not exist." };
    }

    // Check existing stock level for this warehouse + product to preserve reserved if not explicitly provided
    const existingStock = await prisma.stockLevel.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
    });

    const reserved =
      input.reserved !== undefined
        ? Math.max(0, Math.floor(Number(input.reserved) || 0))
        : existingStock?.reserved ?? 0;

    const available = calculateAvailableStock(inStock, reserved);

    const saved = await prisma.stockLevel.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      create: {
        warehouseId,
        productId,
        inStock,
        reserved,
      },
      update: {
        inStock,
        reserved,
      },
    });

    // Synchronize aggregate quantityOnHand on Product per schema.md specification
    try {
      const aggregateStock = await prisma.stockLevel.aggregate({
        where: { productId },
        _sum: { inStock: true },
      });
      await prisma.product.update({
        where: { id: productId },
        data: { quantityOnHand: aggregateStock._sum.inStock ?? inStock },
      });
    } catch (aggErr) {
      console.warn("Could not synchronize product quantityOnHand:", aggErr);
    }

    try {
      revalidatePath("/fulfillment");
      revalidatePath("/products");
      revalidatePath("/dashboard");
    } catch {
      // Ignored in non-HTTP / CLI contexts
    }

    return {
      success: true,
      stockLevel: {
        id: saved.id,
        warehouseId: saved.warehouseId,
        productId: saved.productId,
        inStock: saved.inStock,
        reserved: saved.reserved,
        available,
      },
      message: `Stock saved for ${product.name} in ${warehouse.name}: ${inStock} In Stock, ${reserved} Reserved, ${available} Available.`,
    };
  } catch (error: any) {
    console.error("Failed to set stock level:", error);
    return {
      success: false,
      error: error.message || "Failed to set stock level.",
    };
  }
}

export interface SaveAllocationInput {
  warehouseId: string;
  quantityFulfilled: number;
  estimatedCost?: number;
  isBackordered?: boolean;
}

export interface SaveSplitResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Accepts and persists the suggested warehouse split (Step 21).
 */
export async function acceptSuggestedSplitAction(
  fulfillmentId: string,
  allocations: SaveAllocationInput[]
): Promise<SaveSplitResult> {
  try {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: {
        quotation: {
          include: {
            orderLines: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!fulfillment) {
      return { success: false, error: "Fulfillment record not found." };
    }

    // Determine target productId from physical order lines
    const physicalLine = fulfillment.quotation.orderLines.find(
      (l) => l.product.category === "HARDWARE"
    ) || fulfillment.quotation.orderLines[0];

    const allWarehouses = await prisma.warehouse.findMany();
    const defaultWarehouseId = allWarehouses[0]?.id;

    if (!defaultWarehouseId) {
      return { success: false, error: "No warehouses configured in the database." };
    }

    const productId = physicalLine?.productId || (await prisma.product.findFirst())?.id;
    if (!productId) {
      return { success: false, error: "No valid product found on the order." };
    }

    // 1. Delete previous fulfillment lines
    await prisma.fulfillmentLine.deleteMany({
      where: { fulfillmentId },
    });

    // 2. Prepare and validate allocation records
    const validLines = allocations
      .filter((a) => a.quantityFulfilled > 0)
      .map((a) => {
        // If warehouseId is unassigned or invalid, fallback to primary warehouse
        const exists = allWarehouses.some((w) => w.id === a.warehouseId);
        const warehouseId = exists ? a.warehouseId : defaultWarehouseId;

        return {
          fulfillmentId,
          warehouseId,
          productId,
          quantityFulfilled: a.quantityFulfilled,
          estimatedShipments: 1,
          estimatedCost: a.estimatedCost ?? 0,
          isBackordered: Boolean(a.isBackordered),
        };
      });

    if (validLines.length > 0) {
      await prisma.fulfillmentLine.createMany({
        data: validLines,
      });
    }

    // 3. Determine new fulfillment status
    const hasBackorders = validLines.some((l) => l.isBackordered);
    let newStatus: FulfillmentStatus = FulfillmentStatus.FULFILLED;

    if (hasBackorders) {
      newStatus = FulfillmentStatus.BACKORDER;
    } else if (validLines.length > 1) {
      newStatus = FulfillmentStatus.SPLIT_PENDING;
    }

    await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: { status: newStatus },
    });

    try {
      revalidatePath(`/fulfillment/${fulfillmentId}`);
      revalidatePath(`/fulfillment/${fulfillment.quotation.displayCode}`);
      revalidatePath("/fulfillment");
      revalidatePath("/dashboard");
    } catch {
      // Ignored in non-HTTP contexts
    }

    return {
      success: true,
      message: `Suggested split accepted! ${validLines.length} warehouse allocation(s) saved.`,
    };
  } catch (error: any) {
    console.error("Failed to accept suggested split:", error);
    return {
      success: false,
      error: error.message || "Failed to accept suggested split.",
    };
  }
}

/**
 * Saves manual override quantities entered by operations user (Step 21).
 */
export async function manualOverrideSplitAction(
  fulfillmentId: string,
  allocations: SaveAllocationInput[]
): Promise<SaveSplitResult> {
  try {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: {
        quotation: {
          include: {
            orderLines: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!fulfillment) {
      return { success: false, error: "Fulfillment record not found." };
    }

    const physicalLine = fulfillment.quotation.orderLines.find(
      (l) => l.product.category === "HARDWARE"
    ) || fulfillment.quotation.orderLines[0];

    const allWarehouses = await prisma.warehouse.findMany();
    const defaultWarehouseId = allWarehouses[0]?.id;

    if (!defaultWarehouseId) {
      return { success: false, error: "No warehouses configured in the system." };
    }

    const productId = physicalLine?.productId || (await prisma.product.findFirst())?.id;
    if (!productId) {
      return { success: false, error: "No valid product found on the order." };
    }

    // 1. Delete previous lines
    await prisma.fulfillmentLine.deleteMany({
      where: { fulfillmentId },
    });

    // 2. Prepare manual lines
    const validLines = allocations
      .filter((a) => a.quantityFulfilled > 0)
      .map((a) => {
        const warehouse = allWarehouses.find((w) => w.id === a.warehouseId);
        const warehouseId = warehouse?.id || defaultWarehouseId;
        const weight = warehouse ? Number(warehouse.shippingCostWeight) : 1.0;
        const estimatedCost = Number((a.quantityFulfilled * weight).toFixed(2));

        return {
          fulfillmentId,
          warehouseId,
          productId,
          quantityFulfilled: a.quantityFulfilled,
          estimatedShipments: 1,
          estimatedCost: a.estimatedCost ?? estimatedCost,
          isBackordered: Boolean(a.isBackordered),
        };
      });

    if (validLines.length > 0) {
      await prisma.fulfillmentLine.createMany({
        data: validLines,
      });
    }

    // 3. Update status
    const hasBackorders = validLines.some((l) => l.isBackordered);
    let newStatus: FulfillmentStatus = FulfillmentStatus.FULFILLED;

    if (hasBackorders) {
      newStatus = FulfillmentStatus.BACKORDER;
    } else if (validLines.length > 1) {
      newStatus = FulfillmentStatus.SPLIT_PENDING;
    }

    await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: { status: newStatus },
    });

    try {
      revalidatePath(`/fulfillment/${fulfillmentId}`);
      revalidatePath(`/fulfillment/${fulfillment.quotation.displayCode}`);
      revalidatePath("/fulfillment");
      revalidatePath("/dashboard");
    } catch {
      // Ignored in non-HTTP contexts
    }

    return {
      success: true,
      message: `Manual override saved! Stock allocated across ${validLines.length} warehouse(s).`,
    };
  } catch (error: any) {
    console.error("Failed to save manual override:", error);
    return {
      success: false,
      error: error.message || "Failed to save manual override.",
    };
  }
}

/**
 * Consolidates remaining backorders into a single restocked warehouse shipment.
 */
export async function consolidateBackorderAction(
  fulfillmentId: string,
  targetWarehouseId: string
): Promise<SaveSplitResult> {
  try {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { lines: true },
    });

    if (!fulfillment) {
      return { success: false, error: "Fulfillment record not found." };
    }

    const backorderLines = fulfillment.lines.filter((l) => l.isBackordered);
    if (backorderLines.length === 0) {
      return { success: false, error: "No backordered units to consolidate." };
    }

    const totalBackordered = backorderLines.reduce((s, l) => s + l.quantityFulfilled, 0);

    // Remove backorder lines and convert to target warehouse fulfillment line
    await prisma.fulfillmentLine.deleteMany({
      where: {
        fulfillmentId,
        isBackordered: true,
      },
    });

    const targetWarehouse = await prisma.warehouse.findUnique({
      where: { id: targetWarehouseId },
    });

    const weight = targetWarehouse ? Number(targetWarehouse.shippingCostWeight) : 1.0;
    const cost = Number((totalBackordered * weight).toFixed(2));
    const productId = backorderLines[0].productId;

    await prisma.fulfillmentLine.create({
      data: {
        fulfillmentId,
        warehouseId: targetWarehouseId,
        productId,
        quantityFulfilled: totalBackordered,
        estimatedShipments: 1,
        estimatedCost: cost,
        isBackordered: false,
      },
    });

    // Update status to FULFILLED or SPLIT_PENDING
    const remainingLines = await prisma.fulfillmentLine.findMany({
      where: { fulfillmentId },
    });

    const newStatus =
      remainingLines.length > 1 ? FulfillmentStatus.SPLIT_PENDING : FulfillmentStatus.FULFILLED;

    await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: { status: newStatus },
    });

    try {
      revalidatePath(`/fulfillment/${fulfillmentId}`);
      revalidatePath("/fulfillment");
    } catch {}

    return {
      success: true,
      message: `Consolidated ${totalBackordered} backordered units into ${targetWarehouse?.name || "Warehouse"}!`,
    };
  } catch (error: any) {
    console.error("Failed to consolidate backorder:", error);
    return {
      success: false,
      error: error.message || "Failed to consolidate backorders.",
    };
  }
}
