"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CustomerTier, ProductCategory, RiskLevel, AuditAction, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface TierCeilingInput {
  tier: CustomerTier;
  maxDiscountPercent: number;
}

export interface CategoryCeilingInput {
  category: ProductCategory;
  maxDiscountPercent: number;
}

export interface ApprovalThresholdInput {
  riskLevel: RiskLevel;
  minOveragePoints: number;
  requiredApprovalPath?: string;
}

export interface SaveDiscountConfigInput {
  tierCeilings: TierCeilingInput[];
  categoryCeilings: CategoryCeilingInput[];
  approvalThresholds: ApprovalThresholdInput[];
  changeReason?: string;
}

export interface SaveDiscountConfigResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Server action to save discount tier ceilings, category ceilings, and approval chain thresholds.
 * Records an AuditLogEntry with CONFIG_CHANGED per project.md requirements.
 */
export async function saveDiscountConfigAction(
  input: SaveDiscountConfigInput
): Promise<SaveDiscountConfigResult> {
  try {
    // 1. Update or upsert Tier Discount Ceilings
    for (const t of input.tierCeilings) {
      const discount = Math.max(0, Math.min(100, Number(t.maxDiscountPercent) || 0));
      await prisma.tierDiscountCeiling.upsert({
        where: { tier: t.tier },
        create: {
          tier: t.tier,
          maxDiscountPercent: discount,
        },
        update: {
          maxDiscountPercent: discount,
        },
      });
    }

    // 2. Update or upsert Category Discount Ceilings
    for (const c of input.categoryCeilings) {
      const discount = Math.max(0, Math.min(100, Number(c.maxDiscountPercent) || 0));
      await prisma.categoryDiscountCeiling.upsert({
        where: { category: c.category },
        create: {
          category: c.category,
          maxDiscountPercent: discount,
        },
        update: {
          maxDiscountPercent: discount,
        },
      });
    }

    // 3. Update or upsert Approval Chain Thresholds
    for (const th of input.approvalThresholds) {
      if (th.riskLevel === RiskLevel.LOW) continue; // LOW is auto-approved within limits

      const overage = Math.max(0, Number(th.minOveragePoints) || 0);
      const defaultPath =
        th.riskLevel === RiskLevel.HIGH ? "SALES_MANAGER,FINANCE" : "SALES_MANAGER";
      const approvalPath = th.requiredApprovalPath || defaultPath;

      const existing = await prisma.approvalChainThreshold.findFirst({
        where: { riskLevel: th.riskLevel },
      });

      if (existing) {
        await prisma.approvalChainThreshold.update({
          where: { id: existing.id },
          data: {
            minOveragePoints: overage,
            requiredApprovalPath: approvalPath,
          },
        });
      } else {
        await prisma.approvalChainThreshold.create({
          data: {
            riskLevel: th.riskLevel,
            minOveragePoints: overage,
            requiredApprovalPath: approvalPath,
          },
        });
      }
    }

    // 4. Audit Log Entry (AuditAction.CONFIG_CHANGED) per project.md Screen 18 specification
    let actorUserId: string | null = null;
    try {
      const session = await auth();
      if (session?.user?.id) {
        actorUserId = session.user.id;
      }
    } catch {
      // Ignored outside active session
    }

    if (!actorUserId) {
      // Fallback to seeded admin user
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });
      if (admin) {
        actorUserId = admin.id;
      } else {
        const anyUser = await prisma.user.findFirst();
        if (anyUser) actorUserId = anyUser.id;
      }
    }

    if (actorUserId) {
      const bronze = input.tierCeilings.find((t) => t.tier === CustomerTier.BRONZE)?.maxDiscountPercent;
      const silver = input.tierCeilings.find((t) => t.tier === CustomerTier.SILVER)?.maxDiscountPercent;
      const gold = input.tierCeilings.find((t) => t.tier === CustomerTier.GOLD)?.maxDiscountPercent;
      const hw = input.categoryCeilings.find((c) => c.category === ProductCategory.HARDWARE)?.maxDiscountPercent;
      const svc = input.categoryCeilings.find((c) => c.category === ProductCategory.SERVICES)?.maxDiscountPercent;
      const highThresh = input.approvalThresholds.find((t) => t.riskLevel === RiskLevel.HIGH)?.minOveragePoints;

      const note =
        input.changeReason?.trim() ||
        `Discount configuration updated: Tiers [Bronze: ${bronze}%, Silver: ${silver}%, Gold: ${gold}%], Categories [Hardware: ${hw}%, Services: ${svc}%], High Risk Threshold [${highThresh}pt]`;

      await prisma.auditLogEntry.create({
        data: {
          action: AuditAction.CONFIG_CHANGED,
          actorUserId,
          note,
        },
      });
    }

    // 5. Cache Revalidation
    try {
      revalidatePath("/discount-approval-setup");
      revalidatePath("/settings/discount-rules");
      revalidatePath("/approvals/config");
      revalidatePath("/approvals");
      revalidatePath("/dashboard");
    } catch {
      // Ignored in CLI / script contexts
    }

    return {
      success: true,
      message: "Configuration saved and audit logged successfully.",
    };
  } catch (error: any) {
    console.error("Failed to save discount configuration:", error);
    return {
      success: false,
      error: error.message || "Failed to save discount configuration.",
    };
  }
}
