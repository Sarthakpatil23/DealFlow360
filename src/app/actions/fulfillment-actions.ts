"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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
