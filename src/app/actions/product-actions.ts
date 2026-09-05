"use server";

import { prisma } from "@/lib/prisma";
import { ProductCategory, CustomerTier, RecurringCycle } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface VariantData {
  attributeName: string;
  values: string;
  extraPriceDisplay: string;
}

export interface PriceListData {
  tier: string;
  currency: string;
  priceRule: string;
}

export interface SaveProductInput {
  id?: string;
  name: string;
  category: "HARDWARE" | "SERVICES" | "SUBSCRIPTION";
  description?: string;
  basePrice: number;
  unit?: string;
  taxPercent?: number;
  isSubscription?: boolean;
  recurringCycle?: RecurringCycle | null;
  quantityOnHand?: number;
  variants?: VariantData[];
  priceLists?: PriceListData[];
}

export interface SaveProductResult {
  success: boolean;
  productId?: string;
  message?: string;
  error?: string;
}

/**
 * Server action to create or update a product in the database.
 * Reuses existing Prisma models: Product, ProductVariantAttribute, ProductVariantValue, PriceListEntry.
 */
export async function saveProductAction(input: SaveProductInput): Promise<SaveProductResult> {
  try {
    const name = input.name?.trim();
    if (!name) {
      return { success: false, error: "Product name is required." };
    }

    const basePrice = Number(input.basePrice);
    if (isNaN(basePrice) || basePrice < 0) {
      return { success: false, error: "Valid base price is required." };
    }

    const categoryEnum = input.category as ProductCategory;
    const isSubscription = Boolean(input.isSubscription);
    const recurringCycle = isSubscription
      ? (input.recurringCycle || RecurringCycle.MONTHLY)
      : null;
    const unit = input.unit?.trim() || (isSubscription ? "Recurring" : "Each");
    const taxPercent = Number(input.taxPercent) || 0;
    const quantityOnHand = Math.max(0, Math.floor(Number(input.quantityOnHand) || 0));
    const description = input.description?.trim() || null;

    let targetProductId: string;
    const isCreating = !input.id || input.id === "new";

    if (isCreating) {
      const created = await prisma.product.create({
        data: {
          name,
          category: categoryEnum,
          description,
          basePrice,
          unit,
          taxPercent,
          isSubscription,
          recurringCycle,
          quantityOnHand,
        },
      });
      targetProductId = created.id;
    } else {
      // Find existing product by ID or name
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { id: input.id },
            { name: { equals: input.id!.replace(/-/g, " "), mode: "insensitive" } },
            { name: { contains: input.id!, mode: "insensitive" } },
          ],
        },
      });

      if (!existing) {
        const created = await prisma.product.create({
          data: {
            name,
            category: categoryEnum,
            description,
            basePrice,
            unit,
            taxPercent,
            isSubscription,
            recurringCycle,
            quantityOnHand,
          },
        });
        targetProductId = created.id;
      } else {
        const updated = await prisma.product.update({
          where: { id: existing.id },
          data: {
            name,
            category: categoryEnum,
            description,
            basePrice,
            unit,
            taxPercent,
            isSubscription,
            recurringCycle,
            quantityOnHand,
          },
        });
        targetProductId = updated.id;

        // Clean existing variants to sync new definitions
        if (input.variants && input.variants.length > 0) {
          await prisma.productVariantAttribute.deleteMany({
            where: { productId: existing.id },
          });
        }
        // Clean existing price list entries to sync new definitions
        if (input.priceLists && input.priceLists.length > 0) {
          await prisma.priceListEntry.deleteMany({
            where: { productId: existing.id },
          });
        }
      }
    }

    // Persist variant attributes and values
    if (input.variants && input.variants.length > 0) {
      for (const v of input.variants) {
        const attrName = v.attributeName?.trim();
        if (!attrName) continue;

        const valItems = (v.values || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (valItems.length === 0) continue;

        // Parse extra price displays like "+$10/+$30" or "+$30" or "0"
        let extraPrices: number[] = [];
        if (v.extraPriceDisplay && v.extraPriceDisplay !== "0") {
          if (v.extraPriceDisplay.includes("/")) {
            extraPrices = v.extraPriceDisplay.split("/").map((p) => {
              const cleaned = p.replace(/[^0-9.]/g, "");
              return parseFloat(cleaned) || 0;
            });
          } else {
            const cleaned = v.extraPriceDisplay.replace(/[^0-9.]/g, "");
            const val = parseFloat(cleaned) || 0;
            extraPrices = valItems.length > 1 ? [0, val] : [val];
          }
        }

        const attr = await prisma.productVariantAttribute.create({
          data: {
            productId: targetProductId,
            attributeName: attrName,
          },
        });

        for (let idx = 0; idx < valItems.length; idx++) {
          const valName = valItems[idx];
          const extraPrice = extraPrices[idx] ?? (extraPrices.length === 1 && idx > 0 ? extraPrices[0] : 0);
          await prisma.productVariantValue.create({
            data: {
              variantAttributeId: attr.id,
              value: valName,
              extraPrice,
            },
          });
        }
      }
    }

    // Persist price list entries
    if (input.priceLists && input.priceLists.length > 0) {
      for (const pl of input.priceLists) {
        let tier: CustomerTier = CustomerTier.BRONZE;
        const upperTier = (pl.tier || "").toUpperCase();
        if (upperTier === "GOLD") tier = CustomerTier.GOLD;
        else if (upperTier === "SILVER") tier = CustomerTier.SILVER;
        else tier = CustomerTier.BRONZE;

        let adjPercent = 0.0;
        const minusMatch = pl.priceRule.match(/minus\s+(\d+(\.\d+)?)/i);
        const plusMatch = pl.priceRule.match(/plus\s+(\d+(\.\d+)?)/i);
        if (minusMatch) {
          adjPercent = -parseFloat(minusMatch[1]);
        } else if (plusMatch) {
          adjPercent = parseFloat(plusMatch[1]);
        }

        // Support composite currency notations like "USD/EUR"
        const currencies = (pl.currency || "USD")
          .split(/[\/,]/)
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean);

        for (const curr of currencies) {
          try {
            await prisma.priceListEntry.upsert({
              where: {
                productId_tier_currency: {
                  productId: targetProductId,
                  tier,
                  currency: curr,
                },
              },
              create: {
                productId: targetProductId,
                tier,
                currency: curr,
                priceAdjustmentPercent: adjPercent,
              },
              update: {
                priceAdjustmentPercent: adjPercent,
              },
            });
          } catch (e) {
            console.warn("Could not upsert price list entry:", e);
          }
        }
      }
    }

    try {
      revalidatePath("/products");
      revalidatePath(`/products/${targetProductId}`);
      if (input.id) {
        revalidatePath(`/products/${input.id}`);
      }
      revalidatePath("/dashboard");
    } catch {
      // Ignored when invoked in scripts outside Next.js request context
    }

    return {
      success: true,
      productId: targetProductId,
      message: isCreating ? "Product created successfully." : "Product updated successfully.",
    };
  } catch (error: any) {
    console.error("Failed to save product:", error);
    return {
      success: false,
      error: error.message || "Failed to save product to database.",
    };
  }
}
