"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface LineItemData {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  effectiveLimitPercent: number;
  isUpsellAdd?: boolean;
}

export interface QuotationDetailData {
  id: string;
  displayCode: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  priceListName: string;
  stage: string;
  currency: string;
  orderLines: LineItemData[];
}

export async function getQuotationForBuilder(idOrDisplayCode: string) {
  try {
    // If "new", return template
    if (idOrDisplayCode === "new") {
      const defaultCustomer =
        (await prisma.customer.findFirst({
          where: { name: "Acme Corp" },
        })) || (await prisma.customer.findFirst());

      return {
        success: true,
        data: {
          id: "new",
          displayCode: "Q-1042",
          customerId: defaultCustomer?.id || "",
          customerName: defaultCustomer?.name || "Acme Corp",
          customerTier: defaultCustomer?.tier || "GOLD",
          priceListName: `Standard (USD) — ${defaultCustomer?.tier || "Gold"} Tier (15% Max)`,
          stage: "DRAFT",
          currency: "USD",
          orderLines: [
            {
              productId: "",
              productName: "Laptop Pro 14",
              quantity: 2,
              unitPrice: 1200,
              discountPercent: 12,
              effectiveLimitPercent: 15,
              isUpsellAdd: false,
            },
            {
              productId: "",
              productName: "Onsite Setup Service",
              quantity: 1,
              unitPrice: 450,
              discountPercent: 18,
              effectiveLimitPercent: 10,
              isUpsellAdd: false,
            },
            {
              productId: "",
              productName: "Extended Warranty",
              quantity: 1,
              unitPrice: 180,
              discountPercent: 10,
              effectiveLimitPercent: 15,
              isUpsellAdd: false,
            },
          ],
        } as QuotationDetailData,
      };
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrDisplayCode }, { displayCode: idOrDisplayCode }],
      },
      include: {
        customer: true,
        orderLines: {
          orderBy: { createdAt: "asc" },
          include: { product: true },
        },
      },
    });

    if (!quotation) {
      return { success: false, error: `Quotation "${idOrDisplayCode}" not found.` };
    }

    const lines: LineItemData[] = quotation.orderLines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: line.product?.name || "Unknown Product",
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      discountPercent: Number(line.discountPercent),
      effectiveLimitPercent: Number(line.effectiveLimitPercent),
      isUpsellAdd: line.isUpsellAdd,
    }));

    return {
      success: true,
      data: {
        id: quotation.id,
        displayCode: quotation.displayCode,
        customerId: quotation.customerId,
        customerName: quotation.customer.name,
        customerTier: quotation.customer.tier,
        priceListName: `Standard (${quotation.currency}) — ${quotation.customer.tier} Tier (${
          quotation.customer.tier === "GOLD"
            ? "15%"
            : quotation.customer.tier === "SILVER"
            ? "10%"
            : "5%"
        } Max)`,
        stage: quotation.stage,
        currency: quotation.currency,
        orderLines: lines,
      } as QuotationDetailData,
    };
  } catch (err: any) {
    console.error("Failed to load quotation:", err);
    return { success: false, error: err.message || "Failed to load quotation" };
  }
}

export async function getAvailableProductsList() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        basePrice: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      basePrice: Number(p.basePrice),
    }));
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export async function getAvailableCustomersList() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tier: true,
        preferredCurrency: true,
      },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      preferredCurrency: c.preferredCurrency,
    }));
  } catch (err) {
    console.error("Failed to fetch customers:", err);
    return [];
  }
}

export async function saveQuotationAsDraft(payload: {
  id?: string;
  displayCode?: string;
  customerId?: string;
  orderLines: LineItemData[];
}) {
  try {
    let quotationId = payload.id;
    let targetDisplayCode = payload.displayCode || "Q-1042";

    // 1. If quotation doesn't exist yet or is new, find or create
    if (!quotationId || quotationId === "new") {
      let existing = await prisma.quotation.findFirst({
        where: { displayCode: targetDisplayCode },
      });

      if (existing) {
        quotationId = existing.id;
      } else {
        const defaultRep =
          (await prisma.user.findFirst({ where: { role: "REP" } })) ||
          (await prisma.user.findFirst());
        const defaultCustomer =
          (payload.customerId
            ? await prisma.customer.findUnique({ where: { id: payload.customerId } })
            : null) ||
          (await prisma.customer.findFirst({ where: { name: "Acme Corp" } })) ||
          (await prisma.customer.findFirst());

        const created = await prisma.quotation.create({
          data: {
            displayCode: targetDisplayCode,
            customerId: defaultCustomer!.id,
            ownerRepId: defaultRep!.id,
            stage: "DRAFT",
            currency: "USD",
          },
        });
        quotationId = created.id;
      }
    } else {
      // Ensure target quotation is saved as DRAFT
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          stage: "DRAFT",
          lastActivityAt: new Date(),
          ...(payload.customerId ? { customerId: payload.customerId } : {}),
        },
      });
    }

    // 2. Fetch product map to resolve product IDs if missing
    const allProducts = await prisma.product.findMany();
    const productByName = new Map(allProducts.map((p) => [p.name.toLowerCase(), p]));
    const productById = new Map(allProducts.map((p) => [p.id, p]));

    // 3. Delete existing lines for this quotation and recreate with current saved state
    await prisma.orderLine.deleteMany({
      where: { quotationId },
    });

    if (payload.orderLines && payload.orderLines.length > 0) {
      const linesToCreate = payload.orderLines.map((line) => {
        let matchedProduct =
          (line.productId ? productById.get(line.productId) : null) ||
          productByName.get(line.productName.toLowerCase()) ||
          allProducts[0];

        return {
          quotationId: quotationId!,
          productId: matchedProduct.id,
          quantity: Math.max(1, Number(line.quantity) || 1),
          unitPrice: Number(line.unitPrice) || Number(matchedProduct.basePrice),
          discountPercent: Number(line.discountPercent) || 0,
          effectiveLimitPercent: Number(line.effectiveLimitPercent) || 15,
          isUpsellAdd: Boolean(line.isUpsellAdd),
        };
      });

      await prisma.orderLine.createMany({
        data: linesToCreate,
      });
    }

    try {
      revalidatePath(`/quotations/${targetDisplayCode}`);
      revalidatePath(`/quotations/${quotationId}`);
      revalidatePath("/quotations");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      quotationId,
      displayCode: targetDisplayCode,
      message: "Quotation saved as Draft successfully.",
    };
  } catch (err: any) {
    console.error("Error saving quotation draft:", err);
    return { success: false, error: err.message || "Failed to save draft" };
  }
}

export async function submitQuotation(idOrDisplayCode: string) {
  try {
    const q = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: idOrDisplayCode }, { displayCode: idOrDisplayCode }],
      },
    });

    if (!q) {
      return { success: false, error: "Quotation not found" };
    }

    await prisma.quotation.update({
      where: { id: q.id },
      data: {
        stage: "PENDING_APPROVAL",
        lastActivityAt: new Date(),
      },
    });

    try {
      revalidatePath(`/quotations/${q.displayCode}`);
      revalidatePath(`/quotations/${q.id}`);
      revalidatePath("/quotations");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      message: "Quotation submitted for approval.",
    };
  } catch (err: any) {
    console.error("Error submitting quotation:", err);
    return { success: false, error: err.message || "Failed to submit quotation" };
  }
}
