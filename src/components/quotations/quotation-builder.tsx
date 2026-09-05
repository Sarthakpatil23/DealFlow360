"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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
  Minus,
  Trash2, 
  Save, 
  Send, 
  ArrowLeft,
  Loader2,
  Building2,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Package,
  Layers,
  Check,
  ChevronDown,
  Info,
  PackagePlus
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
  const [customerId, setCustomerId] = useState(initialData.customerId || (availableCustomers[0]?.id || ""));
  const [customerTier, setCustomerTier] = useState(initialData.customerTier || (availableCustomers[0]?.tier || "GOLD"));
  const [priceListName, setPriceListName] = useState(
    initialData.priceListName || "Standard (USD) — Gold Tier (15% Max)"
  );
  const [displayCode, setDisplayCode] = useState(initialData.displayCode || "Q-1043");
  const [lines, setLines] = useState<LineItemData[]>(initialData.orderLines || []);
  const [stage, setStage] = useState(initialData.stage || "DRAFT");

  // Selection for adding catalog products
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Customer tier ceiling percentage
  const tierCeilingPercent = customerTier === "GOLD" ? 15 : customerTier === "SILVER" ? 10 : 5;

  // Recalculate effective limit for a line
  function getComputedLineLimit(productCategory: string, tier: string = customerTier, discount: number = 0) {
    const lim = calculateLineDiscountLimit({
      customerTier: tier as any,
      productCategory: (productCategory || "HARDWARE") as any,
      discountPercent: discount,
    });
    return lim;
  }

  // When customer changes, recalculate all line limits
  function handleCustomerSelect(newCustomerId: string) {
    const sel = availableCustomers.find((c) => c.id === newCustomerId);
    setCustomerId(newCustomerId);
    if (sel) {
      setCustomerName(sel.name);
      setCustomerTier(sel.tier);
      const tierMax = sel.tier === "GOLD" ? "15%" : sel.tier === "SILVER" ? "10%" : "5%";
      setPriceListName(`Standard (${sel.preferredCurrency || "USD"}) — ${sel.tier} Tier (${tierMax} Max)`);

      const updatedLines = lines.map((line) => {
        const prod = availableProducts.find(
          (p) => p.id === line.productId || p.name.toLowerCase() === line.productName.toLowerCase()
        );
        const prodCategory = prod?.category || "HARDWARE";
        const lim = getComputedLineLimit(prodCategory, sel.tier, line.discountPercent);

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
    const disc = isNaN(newDiscount) ? 0 : Math.max(0, Math.min(100, Math.round(newDiscount * 10) / 10));
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

    const lim = getComputedLineLimit(product.category, customerTier, 0);

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
    const lim = getComputedLineLimit(prodCategory, customerTier, 0);

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
      setSaveSuccessMessage(res.message || `Quotation ${res.displayCode} saved as Draft.`);
      
      if (isNew && res.displayCode) {
        setTimeout(() => {
          router.push(`/quotations/${res.displayCode}`);
        }, 700);
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
    setIsSubmitting(true);
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
      setIsSubmitting(false);
      setErrorMessage(saveRes.error || "Failed to save quotation before submitting");
      return;
    }

    const res = await submitQuotation(saveRes.quotationId || saveRes.displayCode || displayCode);
    setIsSubmitting(false);

    if (res.success) {
      setStage("PENDING_APPROVAL");
      setSaveSuccessMessage(res.message || "Quotation submitted for approval successfully!");
      
      if (isNew && saveRes.displayCode) {
        setTimeout(() => {
          router.push(`/quotations/${saveRes.displayCode}`);
        }, 700);
      } else {
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        router.refresh();
      }
    } else {
      setErrorMessage(res.error || "Failed to submit for approval");
    }
  }

  // Financial calculations
  const financialTotals = useMemo(() => {
    let gross = 0;
    let totalDiscount = 0;
    let anyOverLimit = false;
    let maxOverage = 0;

    for (const line of lines) {
      const lineGross = line.unitPrice * line.quantity;
      const lineDisc = lineGross * (line.discountPercent / 100);
      gross += lineGross;
      totalDiscount += lineDisc;

      if (line.discountPercent > line.effectiveLimitPercent) {
        anyOverLimit = true;
        const over = line.discountPercent - line.effectiveLimitPercent;
        if (over > maxOverage) {
          maxOverage = over;
        }
      }
    }

    const net = gross - totalDiscount;
    const avgDiscountPercent = gross > 0 ? (totalDiscount / gross) * 100 : 0;

    // Calculate estimated margin across lines (with specific boosters for upsell lines)
    let estimatedMargin = 0;
    for (const line of lines) {
      const lineGross = line.unitPrice * line.quantity;
      const lineNet = lineGross * (1 - line.discountPercent / 100);
      if (line.isUpsellAdd) {
        if (line.productName.toLowerCase().includes("mouse")) {
          estimatedMargin += 18 * line.quantity;
        } else if (line.productName.toLowerCase().includes("care plan")) {
          estimatedMargin += 46 * line.quantity;
        } else if (line.productName.toLowerCase().includes("docking")) {
          estimatedMargin += 28 * line.quantity;
        } else {
          estimatedMargin += lineNet * 0.40;
        }
      } else {
        estimatedMargin += lineNet * 0.30;
      }
    }

    return {
      gross,
      totalDiscount,
      net,
      avgDiscountPercent,
      estimatedMargin,
      anyOverLimit,
      maxOverage,
    };
  }, [lines]);

  // Filter available products
  const filteredProducts = availableProducts.filter((p) => {
    if (selectedCategoryFilter === "ALL") return true;
    return p.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Link
              href="/quotations"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quotations Pipeline
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-semibold">{isNew ? "New Deal" : displayCode}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {isNew ? "Create Quotation" : `Quotation ${displayCode}`}
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-muted text-foreground border border-border font-semibold shadow-2xs">
              {displayCode}
            </span>
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full uppercase border shadow-2xs ${
                stage === "APPROVED"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : stage === "PENDING_APPROVAL"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-border"
              }`}
            >
              ● {stage}
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/70 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-muted-foreground" />}
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSaving || isSubmitting || lines.length === 0}
            onClick={handleSubmitApproval}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-xs ${
              lines.length === 0
                ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                : "bg-[#0070f3] hover:bg-[#0761d1] text-white cursor-pointer shadow-sm hover:shadow"
            }`}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-medium text-destructive shadow-2xs animate-in fade-in duration-150">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3 Parameter Cards with Harmonious Heights & Unified Borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Target Customer */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-3 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Target Customer
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                customerTier === "GOLD"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : customerTier === "SILVER"
                  ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30"
                  : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
              }`}
            >
              {customerTier} TIER ({tierCeilingPercent}% MAX)
            </span>
          </div>

          <div className="relative">
            {availableCustomers.length > 0 ? (
              <div className="relative">
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-10 appearance-none rounded-xl border border-border/80 bg-background hover:bg-muted/30 px-3.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs transition-colors cursor-pointer"
                >
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.tier} Tier ({c.preferredCurrency || "USD"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/80 bg-background px-3.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
            <span>Currency: <strong className="text-foreground font-semibold">USD ($)</strong></span>
            <span>Ceiling: <strong className="text-foreground font-semibold">{tierCeilingPercent}% Max</strong></span>
          </div>
        </div>

        {/* Card 2: Applied Price List */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-3 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Applied Price List
            </span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border font-medium">
              Auto-Selected
            </span>
          </div>

          <div>
            <div className="w-full h-10 rounded-xl border border-border/80 bg-background px-3.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-medium text-foreground truncate">
                {priceListName}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border">
                {customerTier === "GOLD" ? "-10% Base" : "Standard"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
            <span>Currency: <strong className="text-foreground font-semibold">USD</strong></span>
            <span>Rule: <strong className="text-foreground font-semibold">{customerTier === "GOLD" ? "Gold 10% Break" : "Standard Base"}</strong></span>
          </div>
        </div>

        {/* Card 3: Approval Forecast */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-3 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              {financialTotals.anyOverLimit ? (
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              Approval Forecast
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                financialTotals.anyOverLimit
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              }`}
            >
              {financialTotals.anyOverLimit ? "FLAGGED FOR APPROVAL" : "AUTO-APPROVABLE"}
            </span>
          </div>

          <div>
            <div
              className={`w-full h-10 rounded-xl border px-3.5 flex items-center justify-between shadow-2xs ${
                financialTotals.anyOverLimit
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {financialTotals.anyOverLimit ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-semibold truncate">
                  {financialTotals.anyOverLimit
                    ? `Over limit (+${financialTotals.maxOverage.toFixed(1)}pt) · Requires Manager`
                    : "Within limits · 1-Click Auto-Approve"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
            <span>Lines Checked: <strong className="text-foreground font-semibold">{lines.length}</strong></span>
            <span>Avg Discount: <strong className="text-foreground font-semibold">{financialTotals.avgDiscountPercent.toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Line Items Container */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs transition-colors">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Quotation Line Items
            </h2>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              {lines.length} {lines.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
            <span>Dual-Ceiling Validation:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-foreground px-2 py-0.5 rounded bg-muted border border-border">
              Stricter ceiling wins
            </span>
          </div>
        </div>

        {/* Lines Table or Empty State */}
        {lines.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
              <PackagePlus className="h-7 w-7 text-primary/80" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-bold text-foreground">Your quotation is currently empty</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add products from the catalog toolbar below, or click any of the recommended starter items to begin building this quote.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddSuggestion("Laptop Pro 14", 1200, false)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-background hover:bg-muted border border-border text-foreground transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                + Laptop Pro 14 ($1,200)
              </button>
              <button
                type="button"
                onClick={() => handleAddSuggestion("Onsite Setup Service", 450, false)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-background hover:bg-muted border border-border text-foreground transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                + Onsite Setup Service ($450)
              </button>
              <button
                type="button"
                onClick={() => handleAddSuggestion("Wireless Mouse", 35, true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-background hover:bg-muted border border-border text-foreground transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                + Wireless Mouse ($35)
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4 text-foreground">Product & Category</th>
                  <th className="py-3.5 px-3 text-right text-foreground w-28">Unit Price</th>
                  <th className="py-3.5 px-3 text-center text-foreground w-32">Qty</th>
                  <th className="py-3.5 px-3 text-center text-foreground w-28">Discount %</th>
                  <th className="py-3.5 px-3 text-center text-foreground w-24">Limit %</th>
                  <th className="py-3.5 px-3 text-center text-foreground w-32">Status</th>
                  <th className="py-3.5 px-4 text-right text-foreground w-32">Line Net</th>
                  <th className="py-3.5 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {lines.map((line, idx) => {
                  const isOver = line.discountPercent > line.effectiveLimitPercent;
                  const overPoints = isOver ? (line.discountPercent - line.effectiveLimitPercent).toFixed(1) : 0;
                  const lineGross = line.unitPrice * line.quantity;
                  const lineNet = lineGross * (1 - line.discountPercent / 100);

                  const matchedProduct = availableProducts.find(
                    (p) => p.id === line.productId || p.name.toLowerCase() === line.productName.toLowerCase()
                  );

                  return (
                    <tr
                      key={line.id || `line-${idx}`}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Product Name & Category */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{line.productName}</span>
                          {line.isUpsellAdd && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              Upsell
                            </span>
                          )}
                          {matchedProduct && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              {matchedProduct.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 text-right font-mono text-foreground font-medium">
                        ${line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center rounded-lg border border-border/80 bg-background shadow-2xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, line.quantity - 1)}
                            disabled={line.quantity <= 1}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-9 text-center font-mono font-semibold text-xs text-foreground">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, line.quantity + 1)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Discount % Input */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={line.discountPercent}
                            onChange={(e) => handleDiscountChange(idx, parseFloat(e.target.value))}
                            className={`w-14 rounded-lg border py-1 px-1.5 text-center text-xs font-mono font-semibold focus:outline-none focus:ring-1 shadow-2xs transition-all ${
                              isOver
                                ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 focus:ring-amber-500"
                                : "border-border/80 bg-background text-foreground focus:ring-primary"
                            }`}
                          />
                          <span className="text-xs font-mono text-muted-foreground">%</span>
                        </div>
                      </td>

                      {/* Effective Limit % */}
                      <td className="py-3.5 px-3 text-center font-mono text-muted-foreground font-medium">
                        {line.effectiveLimitPercent}%
                      </td>

                      {/* Status Pill Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            OVER (+{overPoints}pt)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            OK
                          </span>
                        )}
                      </td>

                      {/* Line Net */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        ${lineNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Remove Button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Product Catalog Command Bar */}
        <div className="p-4 bg-muted/20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border border-border">
              {["ALL", "HARDWARE", "SERVICES", "SUBSCRIPTION"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Dropdown with Custom Styling */}
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-10 rounded-xl border border-border/80 bg-background px-3.5 pr-8 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64 cursor-pointer shadow-2xs"
              >
                <option value="">-- Choose catalog product --</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.basePrice.toLocaleString()}) [{p.category}]
                  </option>
                ))}
              </select>
            </div>

            {/* Add Button */}
            <button
              type="button"
              disabled={!selectedProductId}
              onClick={() => handleAddProduct(selectedProductId)}
              className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-foreground text-background px-4 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>

          <div className="text-xs text-muted-foreground text-right w-full md:w-auto font-medium">
            Available Catalog: <strong className="text-foreground font-semibold">{filteredProducts.length}</strong> items
          </div>
        </div>
      </div>

      {/* Smart Upsell and Cross-Sell Suggestions */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <h2 className="text-base font-bold text-foreground">
              Smart Upsell & Cross-Sell Suggestions
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Click card to insert item into quotation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Wireless Mouse */}
          <div
            onClick={() => handleAddSuggestion("Wireless Mouse", 35, true)}
            className="rounded-2xl border border-border/80 bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                +$18 Margin Booster
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Wireless Mouse
              </div>
              <p className="text-xs text-muted-foreground">
                Ergonomic high-precision optical mouse.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="font-bold text-foreground">$35.00</span>
              <span className="text-muted-foreground text-[11px] group-hover:underline">Click to add +</span>
            </div>
          </div>

          {/* Card 2: Docking Station */}
          <div
            onClick={() => handleAddSuggestion("Docking Station", 180, true)}
            className="rounded-2xl border border-border/80 bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                Promo: 12% off
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Docking Station
              </div>
              <p className="text-xs text-muted-foreground">
                Thunderbolt 4 dual 4K display hub.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="font-bold text-foreground">$180.00</span>
              <span className="text-muted-foreground text-[11px] group-hover:underline">Click to add +</span>
            </div>
          </div>

          {/* Card 3: Care Plan 2yr */}
          <div
            onClick={() => handleAddSuggestion("Care Plan 2yr", 46, true)}
            className="rounded-2xl border border-border/80 bg-card p-5 hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-xs transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                +$46 Monthly Recurring
              </span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Care Plan 2yr (Recurring)
              </div>
              <p className="text-xs text-muted-foreground">
                24/7 enterprise SLA hardware support.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="font-bold text-foreground">$46.00/mo</span>
              <span className="text-muted-foreground text-[11px] group-hover:underline">Click to add +</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary & Bottom Actions Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Summary Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 w-full md:w-auto">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">Gross Subtotal</span>
            <span className="font-mono text-base font-semibold text-foreground">
              ${financialTotals.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">Total Discounts</span>
            <span className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
              -${financialTotals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">Estimated Margin</span>
            <span className="font-mono text-base font-semibold text-sky-600 dark:text-sky-400">
              +${financialTotals.estimatedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">Avg Discount</span>
            <span className="font-mono text-base font-semibold text-foreground">
              {financialTotals.avgDiscountPercent.toFixed(1)}%
            </span>
          </div>

          <div className="border-l border-border pl-6">
            <span className="text-[11px] font-medium text-muted-foreground block">Final Quote Total</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-foreground">
              ${financialTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={handleSaveDraft}
            className="rounded-xl border border-border bg-card hover:bg-muted text-foreground px-5 py-2.5 text-xs font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-muted-foreground" />}
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSaving || isSubmitting || lines.length === 0}
            onClick={handleSubmitApproval}
            className={`rounded-xl px-6 py-2.5 text-xs font-semibold transition-all shadow-xs flex items-center gap-2 ${
              lines.length === 0
                ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                : "bg-[#0070f3] hover:bg-[#0761d1] text-white cursor-pointer shadow-sm hover:shadow"
            }`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}
