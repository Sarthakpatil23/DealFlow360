"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductDetailData } from "@/lib/products-data";
import { RecurringCycle } from "@prisma/client";

interface ProductDetailsFormProps {
  initialData: ProductDetailData;
  isNew?: boolean;
}

export function ProductDetailsForm({ initialData, isNew = false }: ProductDetailsFormProps) {
  const [name, setName] = useState(initialData.name);
  const [category, setCategory] = useState<"HARDWARE" | "SERVICES" | "SUBSCRIPTION">(
    initialData.category
  );
  const [basePrice, setBasePrice] = useState(initialData.basePrice.toString());
  const [unit, setUnit] = useState(initialData.unit);
  const [description, setDescription] = useState(initialData.description);
  const [taxPercent, setTaxPercent] = useState(initialData.taxPercent.toString());
  const [isSubscription, setIsSubscription] = useState(initialData.isSubscription);
  const [recurringCycle, setRecurringCycle] = useState<RecurringCycle>(
    initialData.recurringCycle || RecurringCycle.MONTHLY
  );
  const [quantityOnHand, setQuantityOnHand] = useState(initialData.quantityOnHand.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubscriptionToggle = (val: boolean) => {
    setIsSubscription(val);
    if (val) {
      setUnit("Recurring");
      if (category !== "SUBSCRIPTION") setCategory("SUBSCRIPTION");
    } else {
      setUnit("Each");
      if (category === "SUBSCRIPTION") setCategory("HARDWARE");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Info Card */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs transition-colors duration-150">
        <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-3">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
            General Info
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="product-name"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Product name
              </label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] placeholder:text-[#8f8f8f] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                placeholder="e.g. Laptop Pro 14"
              />
            </div>

            <div>
              <label
                htmlFor="product-category"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Category
              </label>
              <select
                id="product-category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value as "HARDWARE" | "SERVICES" | "SUBSCRIPTION";
                  setCategory(val);
                  if (val === "SUBSCRIPTION") {
                    setIsSubscription(true);
                    setUnit("Recurring");
                  }
                }}
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
              >
                <option value="HARDWARE">Hardware</option>
                <option value="SERVICES">Services</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-[#737373] dark:text-[#a1a1a1]">
                  $
                </span>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] pl-7 pr-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="product-unit"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Unit
              </label>
              <input
                id="product-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                placeholder="e.g. Each or Recurring"
              />
            </div>

            <div>
              <label
                htmlFor="product-description"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Description
              </label>
              <textarea
                id="product-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors resize-y"
                placeholder="Detailed product information..."
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="product-tax"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Tax %
              </label>
              <div className="relative">
                <input
                  id="product-tax"
                  type="number"
                  step="0.01"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] pr-8 pl-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                  placeholder="0.00"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-[#737373] dark:text-[#a1a1a1]">
                  %
                </span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5">
                Subscription
              </span>
              <div className="inline-flex rounded-md border border-[#ebebeb] dark:border-[#262626] p-0.5 bg-neutral-100 dark:bg-[#121212]">
                <button
                  type="button"
                  onClick={() => handleSubscriptionToggle(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isSubscription
                      ? "bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-xs"
                      : "text-[#737373] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-white"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscriptionToggle(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    !isSubscription
                      ? "bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-xs"
                      : "text-[#737373] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-white"
                  }`}
                >
                  NO
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#737373] dark:text-[#8f8f8f]">
                If subscription yes then recurring will be visible
              </p>
            </div>

            {/* Recurring - conditionally shown based on wireframe rule */}
            {isSubscription && (
              <div className="transition-all duration-200">
                <label
                  htmlFor="recurring-cycle"
                  className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
                >
                  Recurring
                </label>
                <select
                  id="recurring-cycle"
                  value={recurringCycle}
                  onChange={(e) =>
                    setRecurringCycle(e.target.value as RecurringCycle)
                  }
                  className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="quantity-on-hand"
                className="block text-xs font-medium text-[#737373] dark:text-[#a1a1a1] mb-1.5"
              >
                Quantity on hand <span className="text-[11px] text-[#737373] dark:text-[#8f8f8f]">(Integer field)</span>
              </label>
              <input
                id="quantity-on-hand"
                type="number"
                step="1"
                value={quantityOnHand}
                onChange={(e) => setQuantityOnHand(e.target.value)}
                className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-sm text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Variants Table Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
          Product Variants
        </h2>

        <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Attribute</th>
                <th className="px-6 py-3.5">Values</th>
                <th className="px-6 py-3.5">Extra price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {initialData.variants.length > 0 ? (
                initialData.variants.map((v, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-[#141414] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#171717] dark:text-[#ededed]">
                      {v.attributeName}
                    </td>
                    <td className="px-6 py-3.5 text-[#737373] dark:text-[#a1a1a1]">
                      {v.values}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[#171717] dark:text-[#ededed]">
                      {v.extraPriceDisplay}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-xs text-[#737373] dark:text-[#a1a1a1]">
                    No variants configured for this product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricelists Table Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
          Pricelists
        </h2>

        <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Tier</th>
                <th className="px-6 py-3.5">Currency</th>
                <th className="px-6 py-3.5">Price Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {initialData.priceLists.length > 0 ? (
                initialData.priceLists.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-[#141414] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#171717] dark:text-[#ededed]">
                      {p.tier}
                    </td>
                    <td className="px-6 py-3.5 text-[#737373] dark:text-[#a1a1a1] font-mono text-xs">
                      {p.currency}
                    </td>
                    <td className="px-6 py-3.5 text-[#171717] dark:text-[#ededed]">
                      {p.priceRule}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-xs text-[#737373] dark:text-[#a1a1a1]">
                    No pricelist rules configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banner Notes matching screen16-17.png */}
      <div className="rounded-xl border border-amber-300/60 dark:border-amber-900/60 bg-amber-50/70 dark:bg-[#1a1608] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed shadow-2xs space-y-1">
        <p>Product details should be filled.</p>
        <p>Recurring order with this product will be invoiced at the beginning of the period.</p>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="bg-[#0070f3] hover:bg-[#0761d1] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2"
        >
          {isNew ? "Create Product" : "Save Changes"}
        </button>

        <Link
          href="/products"
          className="border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </Link>

        {savedSuccess && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            ✓ Product details saved successfully
          </span>
        )}
      </div>
    </form>
  );
}
