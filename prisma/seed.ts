import {
  PrismaClient,
  UserRole,
  CustomerTier,
  ProductCategory,
  RecurringCycle,
  QuotationStage,
  RiskLevel,
  ApprovalStepRole,
  ApprovalStepStatus,
  AuditAction,
  FulfillmentStatus,
  SubscriptionStatus,
  InvoiceType,
  InvoiceStatus,
  DealHealthAlertType,
  DealHealthAlertAction,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DealFlow360 Comprehensive Database Seeding (300-500+ records)...");

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

  console.log("🧹 Cleaned existing database tables.");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 2. Seed Internal Users (Canonical + Additional Reps & Managers)
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

  const repJenkins = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "sjenkins@dealflow.com",
      passwordHash: defaultPasswordHash,
      role: UserRole.REP,
    },
  });

  const repChen = await prisma.user.create({
    data: {
      name: "David Chen",
      email: "dchen@dealflow.com",
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

  const managerMorgan = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "amorgan@dealflow.com",
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

  const allReps = [repRao, repJenkins, repChen];
  console.log("👤 Created 7 internal users (Admin, 3 Reps, 2 Managers, 1 Finance).");

  // 3. Seed Canonical Customers
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
      customerUsers: {
        create: {
          email: "ops@novaretail.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  const zenith = await prisma.customer.create({
    data: {
      name: "Zenith Co",
      tier: CustomerTier.SILVER,
      preferredCurrency: "USD",
      customerUsers: {
        create: {
          email: "purchasing@zenith.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  const delta = await prisma.customer.create({
    data: {
      name: "Delta LLC",
      tier: CustomerTier.BRONZE,
      preferredCurrency: "USD",
      customerUsers: {
        create: {
          email: "contact@deltallc.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  const orion = await prisma.customer.create({
    data: {
      name: "Orion Ltd",
      tier: CustomerTier.GOLD,
      preferredCurrency: "USD",
      customerUsers: {
        create: {
          email: "admin@orionltd.com",
          passwordHash: defaultPasswordHash,
        },
      },
    },
  });

  // Additional 15 Enterprise B2B Customers
  const additionalCustomerData: { name: string; tier: CustomerTier; email: string }[] = [
    { name: "Nexus Dynamics", tier: CustomerTier.GOLD, email: "ops@nexusdynamics.io" },
    { name: "Apex Logistics", tier: CustomerTier.SILVER, email: "procure@apexlogistics.com" },
    { name: "CloudScale Inc", tier: CustomerTier.GOLD, email: "it@cloudscale.net" },
    { name: "CyberVanguard", tier: CustomerTier.BRONZE, email: "security@cybervanguard.com" },
    { name: "Quantum Systems", tier: CustomerTier.GOLD, email: "orders@quantumsystems.io" },
    { name: "Horizon Health", tier: CustomerTier.SILVER, email: "supply@horizonhealth.org" },
    { name: "FinTech Global", tier: CustomerTier.GOLD, email: "tech@fintechglobal.com" },
    { name: "Vertex Media", tier: CustomerTier.BRONZE, email: "admin@vertexmedia.com" },
    { name: "SolarGrid Corp", tier: CustomerTier.SILVER, email: "procurement@solargrid.com" },
    { name: "Titan Manufacturing", tier: CustomerTier.GOLD, email: "direct@titanmfg.com" },
    { name: "BlueWave Tech", tier: CustomerTier.SILVER, email: "buyer@bluewavetech.com" },
    { name: "Sterling Group", tier: CustomerTier.BRONZE, email: "finance@sterlinggrp.com" },
    { name: "Pulse Analytics", tier: CustomerTier.GOLD, email: "data@pulseanalytics.ai" },
    { name: "Echo Systems", tier: CustomerTier.SILVER, email: "support@echosys.com" },
    { name: "Summit Enterprises", tier: CustomerTier.GOLD, email: "deals@summitent.com" },
  ];

  const extraCustomers = [];
  for (const c of additionalCustomerData) {
    const cust = await prisma.customer.create({
      data: {
        name: c.name,
        tier: c.tier,
        preferredCurrency: "USD",
        customerUsers: {
          create: {
            email: c.email,
            passwordHash: defaultPasswordHash,
          },
        },
      },
    });
    extraCustomers.push(cust);
  }

  const allCustomers = [acme, beta, nova, zenith, delta, orion, ...extraCustomers];
  console.log(`🏢 Created ${allCustomers.length} Customers with active portal logins.`);

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
    data: { name: "Main Warehouse", shippingCostWeight: 1.0 },
  });

  const eastDepot = await prisma.warehouse.create({
    data: { name: "East Depot", shippingCostWeight: 1.5 },
  });

  const westHub = await prisma.warehouse.create({
    data: { name: "West Logistics Hub", shippingCostWeight: 1.8 },
  });

  const southCenter = await prisma.warehouse.create({
    data: { name: "South Distribution", shippingCostWeight: 1.2 },
  });

  const allWarehouses = [mainWarehouse, eastDepot, westHub, southCenter];
  console.log("🏭 Created 4 Regional Warehouses.");

  // 6. Seed Catalog Products
  const laptop = await prisma.product.create({
    data: {
      name: "Laptop Pro 14",
      category: ProductCategory.HARDWARE,
      description: "High-performance business laptop with 14-inch retina display",
      basePrice: 1200.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 250,
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
        ],
      },
      priceListEntries: {
        create: [
          { tier: CustomerTier.BRONZE, currency: "USD", priceAdjustmentPercent: 0.0 },
          { tier: CustomerTier.GOLD, currency: "USD", priceAdjustmentPercent: -10.0 },
        ],
      },
    },
  });

  const ultraBook16 = await prisma.product.create({
    data: {
      name: "UltraBook Pro 16",
      category: ProductCategory.HARDWARE,
      description: "Workstation laptop with M3 Max CPU and 32GB unified memory",
      basePrice: 1800.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 180,
    },
  });

  const studioDisplay = await prisma.product.create({
    data: {
      name: "27-inch 4K Studio Display",
      category: ProductCategory.HARDWARE,
      description: "Color-accurate IPS display with Thunderbolt 4 daisy-chaining",
      basePrice: 650.0,
      unit: "Each",
      taxPercent: 15.0,
      quantityOnHand: 200,
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
      quantityOnHand: 350,
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
      quantityOnHand: 600,
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

  const dataMigration = await prisma.product.create({
    data: {
      name: "Data Migration & Cloud Setup",
      category: ProductCategory.SERVICES,
      description: "End-to-end data transfer, encryption setup and DNS cutover",
      basePrice: 750.0,
      unit: "Each",
      taxPercent: 10.0,
      quantityOnHand: 999,
    },
  });

  const extendedWarranty = await prisma.product.create({
    data: {
      name: "Extended Warranty",
      category: ProductCategory.SERVICES,
      description: "3-year comprehensive hardware replacement coverage",
      basePrice: 180.0,
      unit: "Each",
      taxPercent: 10.0,
      quantityOnHand: 999,
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
      description: "Dedicated technical account manager with 1hr response SLA",
      basePrice: 300.0,
      unit: "Recurring",
      isSubscription: true,
      recurringCycle: RecurringCycle.QUARTERLY,
      taxPercent: 0.0,
      quantityOnHand: 999,
    },
  });

  const cloudBackup = await prisma.product.create({
    data: {
      name: "Enterprise Cloud Backup",
      category: ProductCategory.SUBSCRIPTION,
      description: "Automated continuous endpoint snapshot backup and ransomware recovery",
      basePrice: 85.0,
      unit: "Recurring",
      isSubscription: true,
      recurringCycle: RecurringCycle.MONTHLY,
      taxPercent: 0.0,
      quantityOnHand: 999,
    },
  });

  const allProducts = [
    laptop,
    ultraBook16,
    studioDisplay,
    dockingStation,
    wirelessMouse,
    setupService,
    dataMigration,
    extendedWarranty,
    carePlan2yr,
    supportSla,
    cloudBackup,
  ];

  console.log(`📦 Created ${allProducts.length} Enterprise Products across Hardware, Services, and Subscriptions.`);

  // 7. Seed Stock Levels Across Warehouses
  const stockData = [];
  for (const wh of allWarehouses) {
    stockData.push(
      { warehouseId: wh.id, productId: laptop.id, inStock: 50, reserved: 10 },
      { warehouseId: wh.id, productId: ultraBook16.id, inStock: 35, reserved: 5 },
      { warehouseId: wh.id, productId: studioDisplay.id, inStock: 45, reserved: 8 },
      { warehouseId: wh.id, productId: dockingStation.id, inStock: 80, reserved: 15 },
      { warehouseId: wh.id, productId: wirelessMouse.id, inStock: 120, reserved: 20 }
    );
  }
  await prisma.stockLevel.createMany({ data: stockData });
  console.log(`📊 Created ${stockData.length} Warehouse Stock Level records.`);

  // 8. Seed Upsell Rules
  await prisma.upsellRule.createMany({
    data: [
      { baseProductId: laptop.id, suggestedProductId: wirelessMouse.id, minMarginThreshold: 18.0, isPromoted: false },
      { baseProductId: laptop.id, suggestedProductId: dockingStation.id, minMarginThreshold: 25.0, isPromoted: true },
      { baseProductId: laptop.id, suggestedProductId: carePlan2yr.id, minMarginThreshold: 46.0, isPromoted: false },
      { baseProductId: ultraBook16.id, suggestedProductId: studioDisplay.id, minMarginThreshold: 60.0, isPromoted: true },
      { baseProductId: ultraBook16.id, suggestedProductId: carePlan2yr.id, minMarginThreshold: 46.0, isPromoted: false },
    ],
  });
  console.log("💡 Created Upsell / Cross-sell recommendation rules.");

  // 9. Seed Confirmed Orders & Canonical Quotations for Acme Corp (Gold Tier)
  const q1038 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1038",
      customerId: acme.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.CONFIRMED,
      blendedRiskLevel: RiskLevel.LOW,
      currency: "USD",
      lastActivityAt: new Date(Date.now() - 6 * 86400000),
      createdAt: new Date(Date.now() - 8 * 86400000),
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 10,
            unitPrice: 1200.0,
            discountPercent: 10.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
          },
          {
            productId: wirelessMouse.id,
            quantity: 10,
            unitPrice: 35.0,
            discountPercent: 0.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
          },
        ],
      },
      fulfillment: {
        create: {
          status: FulfillmentStatus.FULFILLED,
          lines: {
            create: [
              {
                warehouseId: mainWarehouse.id,
                productId: laptop.id,
                quantityFulfilled: 10,
                estimatedShipments: 1,
                estimatedCost: 15.0,
                isBackordered: false,
                shippedAt: new Date(Date.now() - 5 * 86400000),
              },
              {
                warehouseId: westHub.id,
                productId: wirelessMouse.id,
                quantityFulfilled: 10,
                estimatedShipments: 1,
                estimatedCost: 6.0,
                isBackordered: false,
                shippedAt: new Date(Date.now() - 4 * 86400000),
              },
            ],
          },
        },
      },
      invoices: {
        create: {
          displayCode: "INV-2026-1038",
          customerId: acme.id,
          type: InvoiceType.ONE_TIME,
          amount: 11150.0,
          status: InvoiceStatus.PAID,
          dueDate: new Date(Date.now() - 2 * 86400000),
          paidAt: new Date(Date.now() - 3 * 86400000),
        },
      },
    },
  });

  const q1040 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1040",
      customerId: acme.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.CONFIRMED,
      blendedRiskLevel: RiskLevel.MEDIUM,
      currency: "USD",
      lastActivityAt: new Date(Date.now() - 2 * 86400000),
      createdAt: new Date(Date.now() - 3 * 86400000),
      orderLines: {
        create: [
          {
            productId: laptop.id,
            quantity: 24,
            unitPrice: 1200.0,
            discountPercent: 12.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
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
                isBackordered: false,
                shippedAt: new Date(Date.now() - 1 * 86400000),
              },
              {
                warehouseId: eastDepot.id,
                productId: laptop.id,
                quantityFulfilled: 6,
                estimatedShipments: 1,
                estimatedCost: 9.0,
                isBackordered: true,
                shippedAt: null,
              },
            ],
          },
        },
      },
      invoices: {
        create: {
          displayCode: "INV-2026-1040",
          customerId: acme.id,
          type: InvoiceType.ONE_TIME,
          amount: 25344.0,
          status: InvoiceStatus.UNPAID,
          dueDate: new Date(Date.now() + 12 * 86400000),
          paidAt: null,
        },
      },
    },
  });

  const q1041 = await prisma.quotation.create({
    data: {
      displayCode: "Q-1041",
      customerId: acme.id,
      ownerRepId: repRao.id,
      stage: QuotationStage.NEGOTIATION,
      blendedRiskLevel: RiskLevel.LOW,
      currency: "USD",
      lastActivityAt: new Date(Date.now() - 1 * 86400000),
      createdAt: new Date(Date.now() - 2 * 86400000),
      orderLines: {
        create: [
          {
            productId: ultraBook16.id,
            quantity: 5,
            unitPrice: 1800.0,
            discountPercent: 5.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
          },
          {
            productId: dockingStation.id,
            quantity: 5,
            unitPrice: 180.0,
            discountPercent: 0.0,
            effectiveLimitPercent: 15.0,
            isUpsellAdd: false,
          },
        ],
      },
      negotiationComments: {
        create: [
          {
            orderLineId: undefined,
            commentText: "Could we increase the UltraBook discount to 12% for this 5-unit bundle?",
            counterDiscountPercent: 12.0,
            createdAt: new Date(Date.now() - 1 * 86400000),
          },
        ],
      },
    },
  });

  // Canonical Q-1042 Quotation (Pending Approval, adhering strictly to spec)
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
            note: "Initial 12% discount proposal",
            createdAt: new Date("2026-08-20T10:00:00Z"),
          },
          {
            actorUserId: managerShah.id,
            action: AuditAction.RETURNED_FOR_REVISION,
            note: "Requested justification for 18% service discount",
            createdAt: new Date("2026-08-21T11:00:00Z"),
          },
          {
            actorUserId: repRao.id,
            action: AuditAction.RESUBMITTED,
            note: "Resubmitted with margin notes explaining competitive deal context",
            createdAt: new Date("2026-08-22T14:30:00Z"),
          },
        ],
      },
    },
  });

  // 10. Procedural Generation of 75 Additional Realistic Quotations
  // Generates 75 quotes across all 5 stages, creating 200+ order lines, approval steps, audit logs, and fulfillments
  console.log("⚡ Generating 75 realistic quotations across pipeline stages...");

  const stagesList = [
    QuotationStage.DRAFT,
    QuotationStage.PENDING_APPROVAL,
    QuotationStage.APPROVED,
    QuotationStage.NEGOTIATION,
    QuotationStage.CONFIRMED,
  ];

  let quoteCounter = 1045;

  for (let i = 0; i < 75; i++) {
    const cust = allCustomers[i % allCustomers.length];
    const rep = allReps[i % allReps.length];
    const stage = stagesList[(i * 7 + 2) % stagesList.length];
    const displayCode = `Q-${quoteCounter++}`;

    // Select 2 to 3 distinct products for this quote
    const p1 = allProducts[(i * 2) % allProducts.length];
    const p2 = allProducts[(i * 2 + 1) % allProducts.length];
    const p3 = allProducts[(i * 2 + 2) % allProducts.length];

    // Determine realistic discount percentage (some over limit to trigger risk)
    const disc1 = (i % 5 === 0) ? 18.0 : (i % 3 === 0) ? 12.0 : 5.0;
    const disc2 = (i % 7 === 0) ? 14.0 : 0.0;
    const disc3 = 0.0;

    const risk: RiskLevel = disc1 > 15 || disc2 > 10 ? (disc1 >= 18 ? RiskLevel.HIGH : RiskLevel.MEDIUM) : RiskLevel.LOW;

    // Build dates (spread over the past 30 days)
    const daysAgo = (i * 3) % 28;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    const q = await prisma.quotation.create({
      data: {
        displayCode,
        customerId: cust.id,
        ownerRepId: rep.id,
        stage,
        blendedRiskLevel: risk,
        currency: "USD",
        createdAt: createdDate,
        lastActivityAt: createdDate,
        orderLines: {
          create: [
            {
              productId: p1.id,
              quantity: (i % 4) + 1,
              unitPrice: Number(p1.basePrice),
              discountPercent: disc1,
              effectiveLimitPercent: 15.0,
              isUpsellAdd: false,
            },
            {
              productId: p2.id,
              quantity: (i % 3) + 1,
              unitPrice: Number(p2.basePrice),
              discountPercent: disc2,
              effectiveLimitPercent: 10.0,
              isUpsellAdd: false,
            },
            {
              productId: p3.id,
              quantity: 1,
              unitPrice: Number(p3.basePrice),
              discountPercent: disc3,
              effectiveLimitPercent: 15.0,
              isUpsellAdd: p3.isSubscription,
            },
          ],
        },
      },
    });

    // Add approval steps if PENDING_APPROVAL or APPROVED
    if (stage === QuotationStage.PENDING_APPROVAL || stage === QuotationStage.APPROVED) {
      await prisma.approvalStep.create({
        data: {
          quotationId: q.id,
          stepOrder: 1,
          requiredRole: ApprovalStepRole.SALES_MANAGER,
          status: stage === QuotationStage.APPROVED ? ApprovalStepStatus.APPROVED : ApprovalStepStatus.PENDING,
          actedAt: stage === QuotationStage.APPROVED ? createdDate : null,
          actedByUserId: stage === QuotationStage.APPROVED ? managerShah.id : null,
        },
      });

      if (risk === RiskLevel.HIGH) {
        await prisma.approvalStep.create({
          data: {
            quotationId: q.id,
            stepOrder: 2,
            requiredRole: ApprovalStepRole.FINANCE,
            status: stage === QuotationStage.APPROVED ? ApprovalStepStatus.APPROVED : ApprovalStepStatus.PENDING,
            actedAt: stage === QuotationStage.APPROVED ? createdDate : null,
            actedByUserId: stage === QuotationStage.APPROVED ? financeIyer.id : null,
          },
        });
      }

      await prisma.auditLogEntry.create({
        data: {
          quotationId: q.id,
          actorUserId: rep.id,
          action: AuditAction.SUBMITTED,
          note: `Submitted quote with ${risk} risk evaluation.`,
          createdAt: createdDate,
        },
      });
    }

    // Add negotiation comments if in NEGOTIATION
    if (stage === QuotationStage.NEGOTIATION) {
      await prisma.negotiationComment.create({
        data: {
          quotationId: q.id,
          commentText: "Could we increase the line discount to 15% to finalize internal approval?",
          counterDiscountPercent: 15.0,
          createdAt: createdDate,
        },
      });
    }

    // Add fulfillment record and invoice if CONFIRMED
    if (stage === QuotationStage.CONFIRMED) {
      const isFulfilled = i % 2 === 0;
      await prisma.fulfillment.create({
        data: {
          quotationId: q.id,
          status: isFulfilled ? FulfillmentStatus.FULFILLED : FulfillmentStatus.SPLIT_PENDING,
          lines: {
            create: [
              {
                warehouseId: allWarehouses[i % allWarehouses.length].id,
                productId: p1.id,
                quantityFulfilled: 2,
                estimatedShipments: 1,
                estimatedCost: 8.5,
                isBackordered: false,
                shippedAt: new Date(Date.now() - 3 * 86400000),
              },
              {
                warehouseId: allWarehouses[(i + 1) % allWarehouses.length].id,
                productId: p2.id,
                quantityFulfilled: 1,
                estimatedShipments: 1,
                estimatedCost: 4.0,
                isBackordered: !isFulfilled,
                shippedAt: isFulfilled ? new Date(Date.now() - 1 * 86400000) : null,
              },
            ],
          },
        },
      });

      await prisma.invoice.create({
        data: {
          displayCode: `INV-2026-${displayCode.replace("Q-", "")}`,
          customerId: cust.id,
          quotationId: q.id,
          type: InvoiceType.ONE_TIME,
          amount: 2200.0 + (i * 95),
          status: isFulfilled ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
          dueDate: new Date(Date.now() + 10 * 86400000),
          paidAt: isFulfilled ? new Date(Date.now() - 2 * 86400000) : null,
        },
      });
    }
  }

  console.log("✅ Created 75 detailed Quotations with lines, approvals, audits, and fulfillments.");

  // 11. Seed Subscriptions (Canonical + Batch of 25 Subscriptions)
  const subscriptionPlans = [
    { name: "Care Plan 2yr", cycle: RecurringCycle.MONTHLY, price: 46.0 },
    { name: "Enterprise Cloud Backup", cycle: RecurringCycle.MONTHLY, price: 85.0 },
    { name: "Support SLA", cycle: RecurringCycle.QUARTERLY, price: 300.0 },
  ];

  const subStatuses = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAUSED,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
  ];

  const subData = [];
  for (let i = 0; i < 25; i++) {
    const cust = allCustomers[i % allCustomers.length];
    const plan = subscriptionPlans[i % subscriptionPlans.length];
    const status = subStatuses[i % subStatuses.length];

    const nextBill = new Date();
    nextBill.setDate(nextBill.getDate() + ((i * 3) % 25) + 1);

    subData.push({
      customerId: cust.id,
      planName: plan.name,
      cycle: plan.cycle,
      pricePerCycle: plan.price,
      nextBillDate: status === SubscriptionStatus.PAUSED ? null : nextBill,
      status: status,
    });
  }

  await prisma.subscription.createMany({ data: subData });
  console.log(`💳 Created ${subData.length} Subscriptions (Active, Paused, and Cancelled).`);

  // 12. Seed Invoices (Canonical + Batch of 35 Invoices)
  let invoiceCounter = 1042;
  const invoiceData = [];

  for (let i = 0; i < 35; i++) {
    const cust = allCustomers[i % allCustomers.length];
    const isPaid = (i % 3 !== 0); // ~66% paid, ~33% unpaid
    const isRecurring = (i % 2 === 0);
    const amount = isRecurring ? (i % 4 === 0 ? 300.0 : 46.0) : (i % 2 === 0 ? 2730.0 : 1850.0);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + ((i * 2) % 20) - 5);

    invoiceData.push({
      displayCode: `INV-${invoiceCounter++}`,
      customerId: cust.id,
      type: isRecurring ? InvoiceType.RECURRING : InvoiceType.ONE_TIME,
      amount: amount,
      status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
      dueDate: dueDate,
      paidAt: isPaid ? dueDate : null,
    });
  }

  await prisma.invoice.createMany({ data: invoiceData });
  console.log(`🧾 Created ${invoiceData.length} Invoices with realistic payment reconciliation.`);

  // 13. Seed Credit Notes
  const creditNotesData = [];
  for (let i = 0; i < 10; i++) {
    const cust = allCustomers[(i * 2) % allCustomers.length];
    creditNotesData.push({
      customerId: cust.id,
      amount: 23.0 + i * 5,
      reason: `Mid-cycle plan modification unused days refund credit (${15 - (i % 5)} days remaining).`,
    });
  }
  await prisma.creditNote.createMany({ data: creditNotesData });
  console.log(`🏷️ Created ${creditNotesData.length} Credit Notes for mid-cycle refunds.`);

  // 14. Seed Deal Health Alerts
  const activeQuotes = await prisma.quotation.findMany({ take: 15 });
  const healthAlertsData = [];

  for (let i = 0; i < activeQuotes.length; i++) {
    const q = activeQuotes[i];
    const type = (i % 3 === 0) ? DealHealthAlertType.STALLED : (i % 3 === 1) ? DealHealthAlertType.DISCOUNT_ANOMALY : DealHealthAlertType.DELIVERY_SLIPPAGE;
    const action = (i % 2 === 0) ? DealHealthAlertAction.NUDGE_SENT : (i % 3 === 0) ? DealHealthAlertAction.ESCALATED : DealHealthAlertAction.NONE;

    healthAlertsData.push({
      quotationId: q.id,
      type,
      issueDescription:
        type === DealHealthAlertType.STALLED
          ? `Idle ${(i * 2) + 7} days with zero customer/rep interaction.`
          : type === DealHealthAlertType.DISCOUNT_ANOMALY
          ? `Average discount 22% vs rep historical average 8%.`
          : `Main Warehouse stock depletion causing delivery timeline slippage.`,
      flaggedAt: new Date(),
      actionTaken: action,
      actionTakenAt: action !== DealHealthAlertAction.NONE ? new Date() : null,
    });
  }

  await prisma.dealHealthAlert.createMany({ data: healthAlertsData });
  console.log(`🚨 Created ${healthAlertsData.length} Deal Health alerts with Nudge & Escalate states.`);

  console.log("\n==================================================================");
  console.log("🎉 DATABASE SEEDED WITH 400+ ENTERPRISE DATA RECORDS SUCCESSFULLY!");
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
