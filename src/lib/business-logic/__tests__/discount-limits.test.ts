import { calculateLineDiscountLimit, DEFAULT_DISCOUNT_CEILINGS } from "../discount-limits";
import { CustomerTier, ProductCategory } from "@prisma/client";

function runTests() {
  console.log("=== RUNNING STEP 14: PER-LINE DISCOUNT LIMIT TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`, details);
      failed++;
    }
  }

  // 1. Test Deal Q-1042 (Acme Corp, Gold Tier)
  console.log("\n[TEST GROUP 1] Deal Q-1042 Canonical Worked Examples (From project.md)");

  // Q-1042 Line 1: Laptop Pro 14 (Hardware, 12% discount)
  const line1 = calculateLineDiscountLimit({
    customerTier: CustomerTier.GOLD,
    productCategory: ProductCategory.HARDWARE,
    discountPercent: 12,
  });
  assert(
    line1.effectiveLimitPercent === 15 &&
      line1.status === "OK" &&
      line1.overagePoints === 0 &&
      line1.statusBadgeText === "OK",
    "Q-1042 Laptop Pro 14 (Hardware 15%, Gold 15% -> Limit 15%): 12% discount is OK",
    line1
  );

  // Q-1042 Line 2: Onsite Setup Service (Services, 18% discount)
  const line2 = calculateLineDiscountLimit({
    customerTier: CustomerTier.GOLD,
    productCategory: ProductCategory.SERVICES,
    discountPercent: 18,
  });
  assert(
    line2.effectiveLimitPercent === 10 &&
      line2.stricterConstraint === "CATEGORY" &&
      line2.status === "OVER" &&
      line2.overagePoints === 8 &&
      line2.statusBadgeText === "OVER (+8pt)",
    "Q-1042 Onsite Setup Service (Services 10% vs Gold 15% -> Stricter 10%): 18% discount is 8pt OVER",
    line2
  );

  // Q-1042 Line 3: Extended Warranty (Subscription/Hardware 15%, 10% discount)
  const line3 = calculateLineDiscountLimit({
    customerTier: CustomerTier.GOLD,
    productCategory: ProductCategory.SUBSCRIPTION,
    discountPercent: 10,
  });
  assert(
    line3.effectiveLimitPercent === 15 &&
      line3.status === "OK" &&
      line3.overagePoints === 0 &&
      line3.statusBadgeText === "OK",
    "Q-1042 Extended Warranty (Category 15%, Gold 15% -> Limit 15%): 10% discount is OK",
    line3
  );

  // 2. Test Stricter Tier Ceiling (Tier Constraint Wins)
  console.log("\n[TEST GROUP 2] Stricter Tier Ceiling Wins");

  // Bronze Tier (5%) with Hardware Category (15%) -> Stricter is Tier (5%)
  const bronzeHardware = calculateLineDiscountLimit({
    customerTier: CustomerTier.BRONZE,
    productCategory: ProductCategory.HARDWARE,
    discountPercent: 8,
  });
  assert(
    bronzeHardware.effectiveLimitPercent === 5 &&
      bronzeHardware.stricterConstraint === "TIER" &&
      bronzeHardware.status === "OVER" &&
      bronzeHardware.overagePoints === 3 &&
      bronzeHardware.statusBadgeText === "OVER (+3pt)",
    "Bronze customer (5%) on Hardware (15%) -> Limit is 5% (tier wins). 8% given -> 3pt OVER",
    bronzeHardware
  );

  // Silver Tier (10%) with Subscription (15%) -> Stricter is Tier (10%)
  const silverSub = calculateLineDiscountLimit({
    customerTier: CustomerTier.SILVER,
    productCategory: ProductCategory.SUBSCRIPTION,
    discountPercent: 10,
  });
  assert(
    silverSub.effectiveLimitPercent === 10 &&
      silverSub.stricterConstraint === "TIER" &&
      silverSub.status === "OK" &&
      silverSub.overagePoints === 0 &&
      silverSub.statusBadgeText === "OK",
    "Silver customer (10%) on Subscription (15%) -> Limit is 10% (tier wins). 10% given -> OK (exact boundary)",
    silverSub
  );

  // 3. Test Boundary Values and Decimal Overages
  console.log("\n[TEST GROUP 3] Boundary Values and Fractional Points");

  // Exact boundary: 15% on 15% limit -> OK
  const exactMatch = calculateLineDiscountLimit({
    customerTier: CustomerTier.GOLD,
    productCategory: ProductCategory.HARDWARE,
    discountPercent: 15,
  });
  assert(
    exactMatch.status === "OK" && exactMatch.overagePoints === 0,
    "Discount exactly equal to limit (15% on 15%) is OK",
    exactMatch
  );

  // 0% discount -> OK
  const zeroDiscount = calculateLineDiscountLimit({
    customerTier: CustomerTier.BRONZE,
    productCategory: ProductCategory.SERVICES,
    discountPercent: 0,
  });
  assert(
    zeroDiscount.status === "OK" && zeroDiscount.overagePoints === 0,
    "0% discount is always OK",
    zeroDiscount
  );

  // Fractional overage: 12.5% on 10% limit -> OVER (+2.5pt)
  const fractionalOverage = calculateLineDiscountLimit({
    customerTier: CustomerTier.SILVER,
    productCategory: ProductCategory.SERVICES,
    discountPercent: 12.5,
  });
  assert(
    fractionalOverage.status === "OVER" &&
      fractionalOverage.overagePoints === 2.5 &&
      fractionalOverage.statusBadgeText === "OVER (+2.5pt)",
    "Fractional overage 12.5% on 10% limit produces OVER (+2.5pt)",
    fractionalOverage
  );

  // 4. Test Dynamic Custom Ceilings (Simulating Screen 18 Admin Configuration)
  console.log("\n[TEST GROUP 4] Dynamic Ceilings from DB Configuration");
  const customCeilings = {
    tiers: {
      BRONZE: 8.0,
      SILVER: 12.0,
      GOLD: 20.0, // Admin bumped Gold ceiling to 20%
    },
    categories: {
      HARDWARE: 15.0,
      SERVICES: 10.0,
      SUBSCRIPTION: 18.0,
    },
  };

  const dynamicCheck = calculateLineDiscountLimit({
    customerTier: CustomerTier.GOLD,
    productCategory: ProductCategory.HARDWARE,
    discountPercent: 18,
    ceilings: customCeilings,
  });
  // Tier is 20%, but Hardware category is 15% -> Hardware category ceiling is stricter (15%)!
  assert(
    dynamicCheck.effectiveLimitPercent === 15 &&
      dynamicCheck.stricterConstraint === "CATEGORY" &&
      dynamicCheck.status === "OVER" &&
      dynamicCheck.overagePoints === 3,
    "Dynamic ceilings: Gold (20%) + Hardware (15%) -> Category limit 15% wins, 18% given is 3pt OVER",
    dynamicCheck
  );

  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
