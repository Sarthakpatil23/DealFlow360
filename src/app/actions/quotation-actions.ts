"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";

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

/**
 * Generates the next sequential quotation display code (e.g. Q-1043).
 * Queries all existing quotation codes matching Q-<number> and returns Q-<max + 1>.
 */
export async function generateNextDisplayCode(): Promise<string> {
  const quotations = await prisma.quotation.findMany({
    select: { displayCode: true },
  });

  let maxNum = 1000;
  for (const q of quotations) {
    const match = q.displayCode.match(/Q-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `Q-${maxNum + 1}`;
}

export async function getQuotationForBuilder(idOrDisplayCode: string) {
  try {
    // If "new", generate next quotation code and pre-fill template
    if (idOrDisplayCode === "new") {
      const defaultCustomer =
        (await prisma.customer.findFirst({
          where: { name: "Acme Corp" },
        })) || (await prisma.customer.findFirst());

      const nextCode = await generateNextDisplayCode();

      const customerTier = (defaultCustomer?.tier || "GOLD") as any;
      const customerCurrency = defaultCustomer?.preferredCurrency || "USD";

      return {
        success: true,
        data: {
          id: "new",
          displayCode: nextCode,
          customerId: defaultCustomer?.id || "",
          customerName: defaultCustomer?.name || "Acme Corp",
          customerTier: customerTier,
          priceListName: `Standard (${customerCurrency}) — ${customerTier} Tier (${
            customerTier === "GOLD" ? "15%" : customerTier === "SILVER" ? "10%" : "5%"
          } Max)`,
          stage: "DRAFT",
          currency: customerCurrency,
          orderLines: [],
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
    let targetDisplayCode = payload.displayCode;

    // 1. If quotation doesn't exist yet or is "new", create a brand new quotation
    if (!quotationId || quotationId === "new") {
      // Validate or generate a unique display code
      if (!targetDisplayCode) {
        targetDisplayCode = await generateNextDisplayCode();
      } else {
        const existingWithCode = await prisma.quotation.findFirst({
          where: { displayCode: targetDisplayCode },
        });
        if (existingWithCode) {
          // Display code already taken by an existing quote, generate the next available code
          targetDisplayCode = await generateNextDisplayCode();
        }
      }

      // Determine owner rep (session or default rep)
      let ownerRepId: string | undefined;
      try {
        const session = await auth();
        if (session?.user?.id && session.user.role !== "CUSTOMER") {
          ownerRepId = session.user.id;
        }
      } catch {
        // Fallback if called outside auth context
      }

      if (!ownerRepId) {
        const defaultRep =
          (await prisma.user.findFirst({ where: { role: "REP" } })) ||
          (await prisma.user.findFirst());
        ownerRepId = defaultRep?.id;
      }

      const defaultCustomer =
        (payload.customerId
          ? await prisma.customer.findUnique({ where: { id: payload.customerId } })
          : null) ||
        (await prisma.customer.findFirst({ where: { name: "Acme Corp" } })) ||
        (await prisma.customer.findFirst());

      if (!defaultCustomer || !ownerRepId) {
        return { success: false, error: "Missing required customer or sales rep to create quotation." };
      }

      const created = await prisma.quotation.create({
        data: {
          displayCode: targetDisplayCode,
          customerId: defaultCustomer.id,
          ownerRepId: ownerRepId,
          stage: "DRAFT",
          currency: defaultCustomer.preferredCurrency || "USD",
        },
      });
      quotationId = created.id;
    } else {
      // Existing quotation update
      const existing = await prisma.quotation.findUnique({
        where: { id: quotationId },
      });
      if (!existing) {
        return { success: false, error: `Quotation "${quotationId}" not found.` };
      }
      targetDisplayCode = existing.displayCode;

      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          stage: "DRAFT",
          lastActivityAt: new Date(),
          ...(payload.customerId ? { customerId: payload.customerId } : {}),
        },
      });
    }

    // 2. Fetch customer tier to evaluate limits
    const currentCustomer = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });
    const customerTier = (currentCustomer?.customer.tier || "GOLD") as any;

    // 3. Fetch product map to resolve product IDs and categories
    const allProducts = await prisma.product.findMany();
    const productByName = new Map(allProducts.map((p) => [p.name.toLowerCase(), p]));
    const productById = new Map(allProducts.map((p) => [p.id, p]));

    // 4. Delete existing lines for this quotation and recreate with current saved state
    await prisma.orderLine.deleteMany({
      where: { quotationId },
    });

    if (payload.orderLines && payload.orderLines.length > 0) {
      const linesToCreate = payload.orderLines.map((line) => {
        const matchedProduct =
          (line.productId ? productById.get(line.productId) : null) ||
          productByName.get(line.productName.toLowerCase()) ||
          allProducts[0];

        // Recalculate effective limit percent using business logic rule
        const limitCheck = calculateLineDiscountLimit({
          customerTier,
          productCategory: matchedProduct.category,
          discountPercent: Number(line.discountPercent) || 0,
        });

        return {
          quotationId: quotationId!,
          productId: matchedProduct.id,
          quantity: Math.max(1, Number(line.quantity) || 1),
          unitPrice: Number(line.unitPrice) || Number(matchedProduct.basePrice),
          discountPercent: Number(line.discountPercent) || 0,
          effectiveLimitPercent: limitCheck.effectiveLimitPercent,
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
      revalidatePath("/dashboard");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      quotationId,
      displayCode: targetDisplayCode,
      message: `Quotation ${targetDisplayCode} saved as Draft successfully.`,
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
      revalidatePath("/dashboard");
      revalidatePath("/approvals");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      message: `Quotation ${q.displayCode} submitted for approval.`,
    };
  } catch (err: any) {
    console.error("Error submitting quotation:", err);
    return { success: false, error: err.message || "Failed to submit quotation" };
  }
}
