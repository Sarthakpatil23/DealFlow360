import { PrismaClient, UserRole, CustomerTier, ProductCategory, RecurringCycle, QuotationStage, RiskLevel, ApprovalStepRole, ApprovalStepStatus, AuditAction, FulfillmentStatus, SubscriptionStatus, InvoiceType, InvoiceStatus, DealHealthAlertType, DealHealthAlertAction } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DealFlow360 Database Seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.dealHealthAlert.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.fulfillmentLine.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.negotiationComment.deleteMany();
  await prisma.auditLogEntry.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.upsellRule.deleteMany();
  await prisma.priceListEntry.deleteMany();
  await prisma.productVariantValue.deleteMany();
  await prisma.productVariantAttribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.approvalChainThreshold.deleteMany();
  await prisma.categoryDiscountCeiling.deleteMany();
  await prisma.tierDiscountCeiling.deleteMany();
  await prisma.customerUser.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing tables.");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 2. Seed Internal Users
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@dealflow.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const repRao = await prisma.user.create({
    data: {
      name: "J. Rao",
      email: "jrao@dealflow.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.REP,
    },
  });

  const managerShah = await prisma.user.create({
    data: {
      name: "M. Shah",
      email: "mshah@dealflow.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.MANAGER,
    },
  });

  const financeIyer = await prisma.user.create({
    data: {
      name: "R. Iyer",
      email: "riyer@dealflow.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.FINANCE,
    },
  });

  console.log("👤 Created internal users (Admin, J. Rao, M. Shah, R. Iyer).");

  // 3. Seed Customers & Portal Users
  const acme = await prisma.customer.create({
    data: {
      name: "Acme Corp",
      tier: CustomerTier.GOLD,
      preferredCurrency: "USD",
      customerUsers: {
        create: {
          email: "procurement@acme.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  const beta = await prisma.customer.create({
    data: {
      name: "Beta Industries",
      tier: CustomerTier.SILVER,
      preferredCurrency: "USD",
      customerUsers: {
        create: {
          email: "buyer@betaind.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  const nova = await prisma.customer.create({
    data: {
      name: "Nova Retail",
      tier: CustomerTier.BRONZE,
      preferredCurrency: "USD",
    },
  });

  const zenith = await prisma.customer.create({
    data: {
      name: "Zenith Co",
      tier: CustomerTier.SILVER,
      preferredCurrency: "USD",
    },
  });

  const delta = await prisma.customer.create({
    data: {
      name: "Delta LLC",
      tier: CustomerTier.BRONZE,
      preferredCurrency: "USD",
    },
  });

  const orion = await prisma.customer.create({
    data: {
      name: "Orion Ltd",
      tier: CustomerTier.GOLD,
      preferredCurrency: "USD",
    },
  });

  console.log("🏢 Created customers (Acme Corp, Beta Industries, Nova Retail, Zenith Co, Delta LLC, Orion Ltd).");

  // 4. Seed Discount Ceilings & Approval Thresholds
  await prisma.tierDiscountCeiling.createMany({
    data: [
      { tier: CustomerTier.BRONZE, maxDiscountPercent: 5.0 },
      { tier: CustomerTier.SILVER, maxDiscountPercent: 10.0 },
      { tier: CustomerTier.GOLD, maxDiscountPercent: 15.0 },
    ],
  });

  await prisma.categoryDiscountCeiling.createMany({
    data: [
      { category: ProductCategory.HARDWARE, maxDiscountPercent: 15.0 },
      { category: ProductCategory.SERVICES, maxDiscountPercent: 10.0 },
      { category: ProductCategory.SUBSCRIPTION, maxDiscountPercent: 15.0 },
    ],
  });

  await prisma.approvalChainThreshold.createMany({
    data: [
      {
        riskLevel: RiskLevel.MEDIUM,
        minOveragePoints: 0.01,
        requiredApprovalPath: "SALES_MANAGER",
      },
      {
        riskLevel: RiskLevel.HIGH,
        minOveragePoints: 8.0,
        requiredApprovalPath: "SALES_MANAGER,FINANCE",
      },
    ],
  });

  console.log("⚙️ Configured Tier Ceilings, Category Ceilings, and Approval Thresholds.");

  // 5. Seed Warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: "Main Warehouse",
      shippingCostWeight: 1.0,
    },
  });

  const eastDepot = await prisma.warehouse.create({
    data: {
      name: "East Depot",
      shippingCostWeight: 1.5,
    },
  });

  console.log("🏭 Created Warehouses (Main Warehouse, East Depot).");

  // 6. Seed Products, Variants, and Pricelists
  const laptop = await prisma.product.create({
    data: {
      name: "Laptop Pro 14",
      category: ProductCategory.HARDWARE,
      description: "High-performance business laptop with 14-inch retina display",
      basePrice: 1200.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 50,
      variantAttributes: {
        create: [
          {
            attributeName: "Color",
            values: {
              create: [
                { value: "Blue", extraPrice: 0 },
                { value: "Black", extraPrice: 0 },
              ],
            },
          },
          {
            attributeName: "RAM",
            values: {
              create: [
                { value: "4GB", extraPrice: 0 },
                { value: "8GB", extraPrice: 30.0 },
              ],
            },
          },
          {
            attributeName: "Manufacturer",
            values: {
              create: [
                { value: "Dell", extraPrice: 10.0 },
                { value: "HP", extraPrice: 30.0 },
              ],
            },
          },
        ],
      },
      priceListEntries: {
        create: [
          { tier: CustomerTier.BRONZE, currency: "USD", priceAdjustmentPercent: 0.0 },
          { tier: CustomerTier.GOLD, currency: "USD", priceAdjustmentPercent: -10.0 },
          { tier: CustomerTier.GOLD, currency: "EUR", priceAdjustmentPercent: -10.0 },
        ],
      },
    },
  });

  const setupService = await prisma.product.create({
    data: {
      name: "Onsite Setup Service",
      category: ProductCategory.SERVICES,
      description: "Complete professional workstation configuration and onboarding",
      basePrice: 450.0,
      unit: "Each",
      taxPercent: 10.0,
      quantityOnHand: 999,
    },
  });

  const extendedWarranty = await prisma.product.create({
    data: {
      name: "Extended Warranty",
      category: ProductCategory.HARDWARE,
      description: "3-year comprehensive hardware replacement coverage",
      basePrice: 180.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 999,
    },
  });

  const dockingStation = await prisma.product.create({
    data: {
      name: "Docking Station",
      category: ProductCategory.HARDWARE,
      description: "Universal Thunderbolt 4 dual 4K dock with 100W PD",
      basePrice: 180.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 77,
      variantAttributes: {
        create: [
          {
            attributeName: "Color",
            values: {
              create: [
                { value: "Space Gray", extraPrice: 10.0 },
                { value: "Black", extraPrice: 0 },
              ],
            },
          },
        ],
      },
    },
  });

  const wirelessMouse = await prisma.product.create({
    data: {
      name: "Wireless Mouse",
      category: ProductCategory.HARDWARE,
      description: "Ergonomic Bluetooth mouse with fast-charging battery",
      basePrice: 35.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 150,
    },
  });

  const carePlan2yr = await prisma.product.create({
    data: {
      name: "Care Plan 2yr",
      category: ProductCategory.SUBSCRIPTION,
      description: "24/7 priority enterprise support & hardware care coverage",
      basePrice: 46.0,
      unit: "Recurring",
      isSubscription: true,
      recurringCycle: RecurringCycle.MONTHLY,
      taxPercent: 0.0,
      quantityOnHand: 999,
    },
  });

  const supportSla = await prisma.product.create({
    data: {
      name: "Support SLA",
      category: ProductCategory.SUBSCRIPTION,
      description: "Dedicated technical account manager with 1hr SLA",
      basePrice: 300.0,
      unit: "Recurring",
      isSubscription: true,
      recurringCycle: RecurringCycle.QUARTERLY,
      taxPercent: 0.0,
      quantityOnHand: 999,
    },
  });

  console.log("📦 Created Catalog Products, Variants, and Pricelists.");

  // 7. Seed Stock Levels
  await prisma.stockLevel.createMany({
    data: [
      { warehouseId: mainWarehouse.id, productId: laptop.id, inStock: 40, reserved: 18 },
      { warehouseId: eastDepot.id, productId: laptop.id, inStock: 10, reserved: 6 },
      { warehouseId: mainWarehouse.id, productId: dockingStation.id, inStock: 65, reserved: 12 },
      { warehouseId: eastDepot.id, productId: dockingStation.id, inStock: 12, reserved: 0 },
      { warehouseId: mainWarehouse.id, productId: wirelessMouse.id, inStock: 100, reserved: 10 },
      { warehouseId: eastDepot.id, productId: wirelessMouse.id, inStock: 50, reserved: 0 },
    ],
  });

  console.log("📊 Created Stock Levels for Main Warehouse & East Depot.");

  // 8. Seed Upsell Rules
  await prisma.upsellRule.createMany({
    data: [
      {
        baseProductId: laptop.id,
        suggestedProductId: wirelessMouse.id,
        minMarginThreshold: 18.0,
        isPromoted: false,
      },
      {
        baseProductId: laptop.id,
        suggestedProductId: dockingStation.id,
        minMarginThreshold: 25.0,
        isPromoted: true,
      },
      {
        baseProductId: laptop.id,
        suggestedProductId: carePlan2yr.id,
        minMarginThreshold: 46.0,
        isPromoted: false,
      },
    ],
  });

  console.log("💡 Created Upsell / Cross-sell rules.");

  // 9. Seed the Central Q-1042 Quotation for Acme Corp
  const q1042 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1042",
      customerId: acme.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.PENDING_APPROVAL,
      blendedRiskLevel: RiskLevel.HIGH,
      currency: "USD",
      lastActivityAt: new Date("2026-08-22T14:30:00Z"),
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 2,
            unitPrice: 1200.0,
            discountPercent: 12.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
            variantSelectionJson: { Color: "Black", RAM: "8GB", Manufacturer: "HP" },
          },
          {
            productId: setupService.id,
            quantity: 1,
            unitPrice: 450.0,
            discountPercent: 18.0,
            effectiveLimitPercent: 10.0,
            isUpsellAdd: false,
          },
          {
            productId: extendedWarranty.id,
            quantity: 1,
            unitPrice: 180.0,
            discountPercent: 10.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
          },
          {
            productId: carePlan2yr.id,
            quantity: 1,
            unitPrice: 46.0,
            discountPercent: 0.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: true,
          },
        ],
      },
      approvalSteps: {
        create: [
          {
            stepOrder: 1,
            requiredRole: ApprovalStepRole.SALES_MANAGER,
            status: ApprovalStepStatus.PENDING,
          },
          {
            stepOrder: 2,
            requiredRole: ApprovalStepRole.FINANCE,
            status: ApprovalStepStatus.PENDING,
          },
        ],
      },
      auditLogEntries: {
        create: [
          {
            actorUserId: repRao.id,
            action: AuditAction.SUBMITTED,
            note: "Initial 12% discount",
            createdAt: new Date("2026-08-20T10:00:00Z"),
          },
          {
            actorUserId: managerShah.id,
            action: AuditAction.RETURNED_FOR_REVISION,
            note: "Requested justification",
            createdAt: new Date("2026-08-21T11:15:00Z"),
          },
          {
            actorUserId: repRao.id,
            action: AuditAction.RESUBMITTED,
            note: "Added margin note",
            createdAt: new Date("2026-08-22T09:30:00Z"),
          },
        ],
      },
      fulfillment: {
        create: {
          status: FulfillmentStatus.SPLIT_PENDING,
          lines: {
            create: [
              {
                warehouseId: mainWarehouse.id,
                productId: laptop.id,
                quantityFulfilled: 18,
                estimatedShipments: 1,
                estimatedCost: 18.0,
              },
              {
                warehouseId: eastDepot.id,
                productId: laptop.id,
                quantityFulfilled: 6,
                estimatedShipments: 1,
                estimatedCost: 29.0,
              },
            ],
          },
        },
      },
    },
  });

  console.log(`📋 Created master quotation ${q1042.displayCode} with lines, approval steps, audit log, and fulfillment.`);

  // 10. Seed Additional Pipeline Quotations (Screens 3, 5, 14)
  await prisma.quotation.create({
    data: {
      displayCode: "Q-1039",
      customerId: beta.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.PENDING_APPROVAL,
      blendedRiskLevel: RiskLevel.MEDIUM,
      currency: "USD",
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 20,
            unitPrice: 1200.0,
            discountPercent: 12.0,
            effectiveLimitPercent: 10.0,
          },
        ],
      },
      approvalSteps: {
        create: [
          {
            stepOrder: 1,
            requiredRole: ApprovalStepRole.FINANCE,
            status: ApprovalStepStatus.PENDING,
            actedByUserId: financeIyer.id,
          },
        ],
      },
    },
  });

  await prisma.quotation.create({
    data: {
      displayCode: "Q-1035",
      customerId: nova.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.APPROVED,
      blendedRiskLevel: RiskLevel.LOW,
      currency: "USD",
      orderLines: {
        create: [
          {
            productId: dockingStation.id,
            quantity: 50,
            unitPrice: 180.0,
            discountPercent: 4.0,
            effectiveLimitPercent: 5.0,
          },
        ],
      },
    },
  });

  const q1030 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1030",
      customerId: zenith.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.NEGOTIATION,
      blendedRiskLevel: RiskLevel.LOW,
      currency: "USD",
      lastActivityAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days idle
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 12,
            unitPrice: 1200.0,
            discountPercent: 8.0,
            effectiveLimitPercent: 10.0,
          },
        ],
      },
      fulfillment: {
        create: {
          status: FulfillmentStatus.BACKORDER,
          lines: {
            create: [
              {
                warehouseId: eastDepot.id,
                productId: laptop.id,
                quantityFulfilled: 0,
                isBackordered: true,
              },
            ],
          },
        },
      },
    },
  });

  const q1020 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1020",
      customerId: delta.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.DRAFT,
      currency: "USD",
      orderLines: {
        create: [
          {
            productId: wirelessMouse.id,
            quantity: 100,
            unitPrice: 35.0,
            discountPercent: 22.0, // Discount anomaly: 22% vs 8% rep avg
            effectiveLimitPercent: 5.0,
          },
        ],
      },
    },
  });

  await prisma.quotation.create({
    data: {
      displayCode: "Q-1025",
      customerId: orion.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.CONFIRMED,
      currency: "USD",
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 35,
            unitPrice: 1200.0,
            discountPercent: 14.0,
            effectiveLimitPercent: 15.0,
          },
        ],
      },
    },
  });

  console.log("📊 Created pipeline quotations (Q-1039, Q-1035, Q-1030, Q-1020, Q-1025).");

  // 11. Seed Invoices & Subscriptions
  await prisma.invoice.createMany({
    data: [
      {
        displayCode: "INV-1042",
        customerId: acme.id,
        quotationId: q1042.id,
        type: InvoiceType.ONE_TIME,
        amount: 2730.0,
        status: InvoiceStatus.UNPAID,
        dueDate: new Date("2026-09-10"),
      },
      {
        displayCode: "INV-1043",
        customerId: acme.id,
        quotationId: q1042.id,
        type: InvoiceType.RECURRING,
        amount: 46.0,
        status: InvoiceStatus.PAID,
        dueDate: new Date("2026-09-15"),
        paidAt: new Date("2026-09-15"),
      },
      {
        displayCode: "INV-1038",
        customerId: nova.id,
        type: InvoiceType.ONE_TIME,
        amount: 9750.0,
        status: InvoiceStatus.PAID,
        dueDate: new Date("2026-08-30"),
        paidAt: new Date("2026-08-30"),
      },
    ],
  });

  await prisma.subscription.createMany({
    data: [
      {
        customerId: acme.id,
        planName: "Care Plan 2yr",
        cycle: RecurringCycle.MONTHLY,
        pricePerCycle: 46.0,
        nextBillDate: new Date("2026-09-15"),
        status: SubscriptionStatus.ACTIVE,
      },
      {
        customerId: beta.id,
        planName: "Support SLA",
        cycle: RecurringCycle.QUARTERLY,
        pricePerCycle: 300.0,
        nextBillDate: new Date("2026-11-01"),
        status: SubscriptionStatus.ACTIVE,
      },
      {
        customerId: delta.id,
        planName: "Care Plan 1yr",
        cycle: RecurringCycle.MONTHLY,
        pricePerCycle: 40.0,
        nextBillDate: null,
        status: SubscriptionStatus.PAUSED,
      },
    ],
  });

  console.log("💰 Created Invoices & Subscriptions.");

  // 12. Seed Deal Health Alerts
  await prisma.dealHealthAlert.createMany({
    data: [
      {
        quotationId: q1030.id,
        type: DealHealthAlertType.STALLED,
        issueDescription: "Idle 9 days",
        flaggedAt: new Date("2026-08-24"),
        actionTaken: DealHealthAlertAction.NUDGE_SENT,
        actionTakenAt: new Date("2026-08-24"),
      },
      {
        quotationId: q1020.id,
        type: DealHealthAlertType.DISCOUNT_ANOMALY,
        issueDescription: "Discount 22% vs avg 8%",
        flaggedAt: new Date("2026-08-25"),
        actionTaken: DealHealthAlertAction.ESCALATED,
        actionTakenAt: new Date("2026-08-25"),
      },
    ],
  });

  console.log("🚨 Created Deal Health Alerts.");
  console.log("✅ DealFlow360 Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
