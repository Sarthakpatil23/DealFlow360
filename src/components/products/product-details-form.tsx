"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductDetailData } from "@/lib/products-data";
import { RecurringCycle } from "@prisma/client";
import { saveProductAction, VariantData, PriceListData } from "@/app/actions/product-actions";

interface ProductDetailsFormProps {
  initialData: ProductDetailData;
  isNew?: boolean;
}

export function ProductDetailsForm({ initialData, isNew = false }: ProductDetailsFormProps) {
  const router = useRouter();

  // Form Fields
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

  // Variants & PriceLists State
  const [variants, setVariants] = useState<VariantData[]>(initialData.variants || []);
  const [priceLists, setPriceLists] = useState<PriceListData[]>(initialData.priceLists || []);

  // UI state for adding new variant / pricelist
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariantAttr, setNewVariantAttr] = useState("");
  const [newVariantValues, setNewVariantValues] = useState("");
  const [newVariantExtra, setNewVariantExtra] = useState("0");

  const [isAddingPriceList, setIsAddingPriceList] = useState(false);
  const [newPlTier, setNewPlTier] = useState("Bronze");
  const [newPlCurrency, setNewPlCurrency] = useState("USD");
  const [newPlRule, setNewPlRule] = useState("Price, no adjustment");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleAddVariant = () => {
    if (!newVariantAttr.trim() || !newVariantValues.trim()) return;
    setVariants((prev) => [
      ...prev,
      {
        attributeName: newVariantAttr.trim(),
        values: newVariantValues.trim(),
        extraPriceDisplay: newVariantExtra.trim() || "0",
      },
    ]);
    setNewVariantAttr("");
    setNewVariantValues("");
    setNewVariantExtra("0");
    setIsAddingVariant(false);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddPriceList = () => {
    if (!newPlTier.trim() || !newPlCurrency.trim()) return;
    setPriceLists((prev) => [
      ...prev,
      {
        tier: newPlTier.trim(),
        currency: newPlCurrency.trim(),
        priceRule: newPlRule.trim() || "Price, no adjustment",
      },
    ]);
    setNewPlTier("Bronze");
    setNewPlCurrency("USD");
    setNewPlRule("Price, no adjustment");
    setIsAddingPriceList(false);
  };

  const handleRemovePriceList = (idx: number) => {
    setPriceLists((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await saveProductAction({
        id: initialData.id,
        name,
        category,
        basePrice: parseFloat(basePrice) || 0,
        unit,
        description,
        taxPercent: parseFloat(taxPercent) || 0,
        isSubscription,
        recurringCycle: isSubscription ? recurringCycle : null,
        quantityOnHand: parseInt(quantityOnHand, 10) || 0,
        variants,
        priceLists,
      });

      if (res.success) {
        setSavedSuccess(true);
        if (isNew && res.productId) {
          router.push(`/products/${res.productId}`);
        } else {
          setTimeout(() => setSavedSuccess(false), 4000);
        }
      } else {
        setErrorMessage(res.error || "Failed to save product to database.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-[#1f0b0e] p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-200 shadow-2xs">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
            Product Variants
          </h2>
          <button
            type="button"
            onClick={() => setIsAddingVariant(!isAddingVariant)}
            className="text-xs font-medium text-[#0070f3] hover:underline dark:text-[#3291ff]"
          >
            {isAddingVariant ? "Cancel" : "+ Add Variant"}
          </button>
        </div>

        {/* Inline Add Variant Form */}
        {isAddingVariant && (
          <div className="p-4 border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-neutral-50 dark:bg-[#121212] grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Attribute Name
              </label>
              <input
                type="text"
                placeholder="e.g. Color or RAM"
                value={newVariantAttr}
                onChange={(e) => setNewVariantAttr(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Values (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Blue, Black"
                value={newVariantValues}
                onChange={(e) => setNewVariantValues(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Extra price
              </label>
              <input
                type="text"
                placeholder="e.g. 0 or +$30"
                value={newVariantExtra}
                onChange={(e) => setNewVariantExtra(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddVariant}
                className="w-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] px-3 py-1.5 rounded text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Add Variant
              </button>
            </div>
          </div>
        )}

        <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Attribute</th>
                <th className="px-6 py-3.5">Values</th>
                <th className="px-6 py-3.5">Extra price</th>
                <th className="px-4 py-3.5 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {variants.length > 0 ? (
                variants.map((v, idx) => (
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
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                        title="Remove variant"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-xs text-[#737373] dark:text-[#a1a1a1]">
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
            Pricelists
          </h2>
          <button
            type="button"
            onClick={() => setIsAddingPriceList(!isAddingPriceList)}
            className="text-xs font-medium text-[#0070f3] hover:underline dark:text-[#3291ff]"
          >
            {isAddingPriceList ? "Cancel" : "+ Add Pricelist"}
          </button>
        </div>

        {/* Inline Add Pricelist Form */}
        {isAddingPriceList && (
          <div className="p-4 border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-neutral-50 dark:bg-[#121212] grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Tier
              </label>
              <select
                value={newPlTier}
                onChange={(e) => setNewPlTier(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Currency
              </label>
              <input
                type="text"
                placeholder="e.g. USD or USD/EUR"
                value={newPlCurrency}
                onChange={(e) => setNewPlCurrency(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a1a1a1] mb-1">
                Price Rule
              </label>
              <input
                type="text"
                placeholder="e.g. Price minus 10 percent base"
                value={newPlRule}
                onChange={(e) => setNewPlRule(e.target.value)}
                className="w-full rounded border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#171717] dark:text-[#ededed]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddPriceList}
                className="w-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] px-3 py-1.5 rounded text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Add Rule
              </button>
            </div>
          </div>
        )}

        <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Tier</th>
                <th className="px-6 py-3.5">Currency</th>
                <th className="px-6 py-3.5">Price Rule</th>
                <th className="px-4 py-3.5 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {priceLists.length > 0 ? (
                priceLists.map((p, idx) => (
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
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePriceList(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                        title="Remove pricelist rule"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-xs text-[#737373] dark:text-[#a1a1a1]">
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
          disabled={isSubmitting}
          className="bg-[#0070f3] hover:bg-[#0761d1] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2 flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          )}
          <span>
            {isSubmitting
              ? "Saving..."
              : isNew
              ? "Create Product"
              : "Save Changes"}
          </span>
        </button>

        <Link
          href="/products"
          className="border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </Link>

        {savedSuccess && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            ✓ Product details saved successfully to database
          </span>
        )}
      </div>
    </form>
  );
}
