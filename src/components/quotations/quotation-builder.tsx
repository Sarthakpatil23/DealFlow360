"use client";

import * as React from "react";
import { useState } from "react";
import { 
  LineItemData, 
  QuotationDetailData, 
  saveQuotationAsDraft, 
  submitQuotation 
} from "@/app/actions/quotation-actions";
import { calculateLineDiscountLimit } from "@/lib/business-logic/discount-limits";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  basePrice: number;
}

interface CustomerOption {
  id: string;
  name: string;
  tier: string;
  preferredCurrency?: string;
}

interface QuotationBuilderProps {
  initialData: QuotationDetailData;
  availableProducts: CatalogProduct[];
  availableCustomers?: CustomerOption[];
}

export function QuotationBuilder({
  initialData,
  availableProducts,
  availableCustomers = [],
}: QuotationBuilderProps) {
  const router = useRouter();

  const isNew = initialData.id === "new";

  const [customerName, setCustomerName] = useState(initialData.customerName || "Acme Corp");
  const [customerId, setCustomerId] = useState(initialData.customerId || "");
  const [customerTier, setCustomerTier] = useState(initialData.customerTier || "GOLD");
  const [priceListName, setPriceListName] = useState(
    initialData.priceListName || "Standard (USD) — Gold Tier (15% Max)"
  );
  const [displayCode, setDisplayCode] = useState(initialData.displayCode || "Q-1043");
  const [lines, setLines] = useState<LineItemData[]>(initialData.orderLines || []);
  const [stage, setStage] = useState(initialData.stage || "DRAFT");

  // Selection for manual add item
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When customer changes, recalculate line limits
  function handleCustomerSelect(newCustomerId: string) {
    const sel = availableCustomers.find((c) => c.id === newCustomerId);
    setCustomerId(newCustomerId);
    if (sel) {
      setCustomerName(sel.name);
      setCustomerTier(sel.tier);
      const tierMax = sel.tier === "GOLD" ? "15%" : sel.tier === "SILVER" ? "10%" : "5%";
      setPriceListName(`Standard (${sel.preferredCurrency || "USD"}) — ${sel.tier} Tier (${tierMax} Max)`);

      // Recompute effective limit for each line under the new customer tier
      const updatedLines = lines.map((line) => {
        const prod = availableProducts.find(
          (p) => p.id === line.productId || p.name.toLowerCase() === line.productName.toLowerCase()
        );
        const prodCategory = (prod?.category || "HARDWARE") as any;
        const lim = calculateLineDiscountLimit({
          customerTier: sel.tier as any,
          productCategory: prodCategory,
          discountPercent: line.discountPercent,
        });

        return {
          ...line,
          effectiveLimitPercent: lim.effectiveLimitPercent,
        };
      });
      setLines(updatedLines);
    }
  }

  // Update quantity of a line
  function handleQuantityChange(index: number, newQty: number) {
    const updated = [...lines];
    const qty = Math.max(1, isNaN(newQty) ? 1 : newQty);
    updated[index] = { ...updated[index], quantity: qty };
    setLines(updated);
  }

  // Update discount percent of a line (live recalculation)
  function handleDiscountChange(index: number, newDiscount: number) {
    const updated = [...lines];
    const disc = isNaN(newDiscount) ? 0 : Math.max(0, Math.min(100, Math.round(newDiscount * 100) / 100));
    updated[index] = { ...updated[index], discountPercent: disc };
    setLines(updated);
  }

  // Remove a line
  function handleRemoveLine(index: number) {
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
  }

  // Add item from catalog dropdown
  function handleAddProduct(prodId: string) {
    const product = availableProducts.find((p) => p.id === prodId);
    if (!product) return;

    // If item already exists, increment quantity
    const existingIndex = lines.findIndex(
      (l) => l.productId === product.id || l.productName.toLowerCase() === product.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].quantity += 1;
      setLines(updated);
      setSaveSuccessMessage(`Increased quantity for ${product.name}`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
      setSelectedProductId("");
      return;
    }

    const lim = calculateLineDiscountLimit({
      customerTier: (customerTier || "GOLD") as any,
      productCategory: (product.category || "HARDWARE") as any,
      discountPercent: 0,
    });

    const newLine: LineItemData = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.basePrice,
      discountPercent: 0,
      effectiveLimitPercent: lim.effectiveLimitPercent,
      isUpsellAdd: false,
    };

    setLines([...lines, newLine]);
    setSelectedProductId("");
    setSaveSuccessMessage(`Added ${product.name} to quotation`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  }

  // Quick-add from Upsell and Cross-Sell Suggestions
  function handleAddSuggestion(productName: string, defaultPrice: number, isUpsell: boolean = true) {
    const existingProduct = availableProducts.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase()
    );

    const existingIndex = lines.findIndex(
      (l) => l.productName.toLowerCase() === productName.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].quantity += 1;
      setLines(updated);
      setSaveSuccessMessage(`Increased quantity for ${productName}`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
      return;
    }

    const prodCategory = existingProduct?.category || (productName.includes("Care") ? "SUBSCRIPTION" : "HARDWARE");
    const lim = calculateLineDiscountLimit({
      customerTier: (customerTier || "GOLD") as any,
      productCategory: prodCategory as any,
      discountPercent: 0,
    });

    const newLine: LineItemData = {
      productId: existingProduct?.id || "",
      productName: productName,
      quantity: 1,
      unitPrice: existingProduct?.basePrice || defaultPrice,
      discountPercent: 0,
      effectiveLimitPercent: lim.effectiveLimitPercent,
      isUpsellAdd: isUpsell,
    };

    setLines([...lines, newLine]);
    setSaveSuccessMessage(`Added suggestion "${productName}" to quotation`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  }

  // Save Draft action
  async function handleSaveDraft() {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const res = await saveQuotationAsDraft({
      id: initialData.id,
      displayCode: displayCode,
      customerId: customerId || undefined,
      orderLines: lines,
    });

    setIsSaving(false);

    if (res.success) {
      setStage("DRAFT");
      setSaveSuccessMessage(res.message || "Quotation saved as Draft successfully.");
      
      if (isNew && res.displayCode) {
        setTimeout(() => {
          router.push(`/quotations/${res.displayCode}`);
        }, 800);
      } else {
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        router.refresh();
      }
    } else {
      setErrorMessage(res.error || "Failed to save draft");
    }
  }

  // Submit for Approval action
  async function handleSubmitApproval() {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    // Save draft state first
    const saveRes = await saveQuotationAsDraft({
      id: initialData.id,
      displayCode: displayCode,
      customerId: customerId || undefined,
      orderLines: lines,
    });

    if (!saveRes.success) {
      setIsSaving(false);
      setErrorMessage(saveRes.error || "Failed to save quotation before submitting");
      return;
    }

    const res = await submitQuotation(saveRes.quotationId || saveRes.displayCode || displayCode);
    setIsSaving(false);

    if (res.success) {
      setStage("PENDING_APPROVAL");
      setSaveSuccessMessage(res.message || "Quotation submitted for approval successfully!");
      
      if (isNew && saveRes.displayCode) {
        setTimeout(() => {
          router.push(`/quotations/${saveRes.displayCode}`);
        }, 800);
      } else {
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        router.refresh();
      }
    } else {
      setErrorMessage(res.error || "Failed to submit for approval");
    }
  }

  // Calculate formatted status
  function getLineStatus(line: LineItemData) {
    if (line.discountPercent > line.effectiveLimitPercent) {
      const overPoints = (line.discountPercent - line.effectiveLimitPercent).toFixed(0);
      return {
        text: `OVER (+${overPoints}pt)`,
        isOver: true,
      };
    }
    return {
      text: "OK",
      isOver: false,
    };
  }

  // Total Quotation Value calculation
  const totalValue = lines.reduce((acc, line) => {
    const gross = line.unitPrice * line.quantity;
    const discountAmount = gross * (line.discountPercent / 100);
    return acc + (gross - discountAmount);
  }, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Quotations Pipeline
        </Link>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-medium text-destructive animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Page Title & Subtitle per Wireframe */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
            {isNew ? "New Quotation:" : "Quotation Detail:"} {displayCode} ({customerName})
          </h1>
          {stage && (
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full uppercase border ${
                stage === "APPROVED"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                  : stage === "PENDING_APPROVAL"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800"
              }`}
            >
              {stage}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isNew
            ? "Configure line items, set discounts, and save to persist as a new quotation."
            : "Opened by clicking a row on the Quotations list. Add products, apply discounts, review upsells."}
        </p>
      </div>

      {/* Form Fields: Customer & Price List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-foreground">
            Customer
          </label>
          <div className="relative">
            {availableCustomers.length > 0 ? (
              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
              >
                {availableCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier} Tier)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-foreground">
            Price List
          </label>
          <input
            type="text"
            value={priceListName}
            onChange={(e) => setPriceListName(e.target.value)}
            placeholder="Standard (USD)"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* Line Items Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold text-foreground">Product</th>
                <th className="py-3 px-4 font-semibold text-foreground w-24 text-center">Qty</th>
                <th className="py-3 px-4 font-semibold text-foreground text-right w-28">Price</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center w-28">Discount</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center w-20">Limit</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center w-32">Status</th>
                <th className="py-3 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    No order lines added yet. Click an upsell suggestion below or add a catalog product.
                  </td>
                </tr>
              ) : (
                lines.map((line, idx) => {
                  const statusInfo = getLineStatus(line);

                  return (
                    <tr
                      key={line.id || `line-${idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4 text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <span>{line.productName}</span>
                          {line.isUpsellAdd && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
                              Upsell
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quantity Input */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10))}
                          className="w-16 rounded-md border border-input bg-background py-1 px-2 text-center text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right font-mono text-foreground font-medium">
                        ${line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* Discount % Input */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={line.discountPercent}
                            onChange={(e) => handleDiscountChange(idx, parseFloat(e.target.value))}
                            className={`w-14 rounded-md border py-1 px-1.5 text-center text-xs font-mono font-medium focus:outline-none focus:ring-1 shadow-2xs ${
                              statusInfo.isOver
                                ? "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 focus:ring-amber-500"
                                : "border-input bg-background text-foreground focus:ring-primary"
                            }`}
                          />
                          <span className="text-xs font-mono text-muted-foreground">%</span>
                        </div>
                      </td>

                      {/* Effective Limit % */}
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground text-xs">
                        {line.effectiveLimitPercent}%
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {statusInfo.isOver ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            {statusInfo.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {statusInfo.text}
                          </span>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-muted"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Inline Dropdown Bar & Total */}
        <div className="p-3 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64"
            >
              <option value="">-- Choose a catalog product to add --</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.basePrice.toLocaleString()})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedProductId}
              onClick={() => handleAddProduct(selectedProductId)}
              className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground text-right w-full sm:w-auto justify-between sm:justify-end">
            <div>
              Total lines: <span className="font-semibold text-foreground">{lines.length}</span>
            </div>
            <div className="border-l border-border pl-4">
              Total Value:{" "}
              <span className="font-bold text-foreground text-sm">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Live Validation Warning Box */}
      <div className="rounded-xl border border-amber-500/40 dark:border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-300 font-medium">
        Discount is checked against each line&apos;s own limit live, as soon as it is entered, not only at submit time.
      </div>

      {/* Upsell and Cross-Sell Suggestions Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-semibold text-sky-600 dark:text-sky-400">
          Upsell and Cross-Sell Suggestions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Suggestion 1: Wireless Mouse */}
          <div
            onClick={() => handleAddSuggestion("Wireless Mouse", 35, true)}
            className="rounded-2xl border border-border bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-1 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                + Wireless Mouse
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Margin +$18
            </p>
          </div>

          {/* Suggestion 2: Docking Station */}
          <div
            onClick={() => handleAddSuggestion("Docking Station", 180, true)}
            className="rounded-2xl border border-border bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-1 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                + Docking Station
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Promo: 12% off
            </p>
          </div>

          {/* Suggestion 3: Care Plan 2yr */}
          <div
            onClick={() => handleAddSuggestion("Care Plan 2yr", 46, true)}
            className="rounded-2xl border border-border bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-1 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                + Care Plan 2yr
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Margin +$46
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons (Save Draft / Submit for Approval) */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveDraft}
          className="rounded-full border border-border bg-card hover:bg-accent text-foreground px-6 py-2.5 text-sm font-medium transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSubmitApproval}
          className="rounded-full bg-[#0070f3] hover:bg-[#0761d1] text-white px-7 py-2.5 text-sm font-medium transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSaving ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
}
