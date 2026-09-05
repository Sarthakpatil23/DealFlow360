"use client";

import { useState } from "react";
import { CustomerTier, ProductCategory, RiskLevel } from "@prisma/client";
import {
  DiscountConfigData,
  TierCeilingItem,
  CategoryCeilingItem,
  ApprovalThresholdItem,
} from "@/lib/discount-config-data";
import { saveDiscountConfigAction } from "@/app/actions/discount-config-actions";
import { ShieldCheck, History, CheckCircle2, AlertCircle } from "lucide-react";

interface DiscountConfigFormProps {
  initialData: DiscountConfigData;
}

export function DiscountConfigForm({ initialData }: DiscountConfigFormProps) {
  // State for Tier Ceilings
  const [tierCeilings, setTierCeilings] = useState<TierCeilingItem[]>(initialData.tierCeilings);

  // State for Category Ceilings
  const [categoryCeilings, setCategoryCeilings] = useState<CategoryCeilingItem[]>(
    initialData.categoryCeilings
  );

  // State for Approval Chain Thresholds
  const [approvalThresholds, setApprovalThresholds] = useState<ApprovalThresholdItem[]>(
    initialData.approvalThresholds
  );

  // Audit Log State
  const [recentAudits, setRecentAudits] = useState(initialData.recentAuditLogs);
  const [changeReason, setChangeReason] = useState("");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTierChange = (tier: CustomerTier, value: string) => {
    const num = parseFloat(value);
    setTierCeilings((prev) =>
      prev.map((item) =>
        item.tier === tier
          ? { ...item, maxDiscountPercent: isNaN(num) ? 0 : num }
          : item
      )
    );
  };

  const handleCategoryChange = (cat: ProductCategory, value: string) => {
    const num = parseFloat(value);
    setCategoryCeilings((prev) =>
      prev.map((item) =>
        item.category === cat
          ? { ...item, maxDiscountPercent: isNaN(num) ? 0 : num }
          : item
      )
    );
  };

  const handleThresholdChange = (riskLevel: RiskLevel, value: string) => {
    const num = parseFloat(value);
    setApprovalThresholds((prev) =>
      prev.map((item) =>
        item.riskLevel === riskLevel
          ? { ...item, minOveragePoints: isNaN(num) ? 0 : num }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await saveDiscountConfigAction({
        tierCeilings: tierCeilings.map((t) => ({
          tier: t.tier,
          maxDiscountPercent: t.maxDiscountPercent,
        })),
        categoryCeilings: categoryCeilings.map((c) => ({
          category: c.category,
          maxDiscountPercent: c.maxDiscountPercent,
        })),
        approvalThresholds: approvalThresholds.map((th) => ({
          riskLevel: th.riskLevel,
          minOveragePoints: th.minOveragePoints,
          requiredApprovalPath:
            th.riskLevel === RiskLevel.HIGH
              ? "SALES_MANAGER,FINANCE"
              : th.riskLevel === RiskLevel.MEDIUM
              ? "SALES_MANAGER"
              : "NO_APPROVAL",
        })),
        changeReason: changeReason.trim() || undefined,
      });

      if (res.success) {
        setSavedSuccess(true);
        // Prepend optimistic audit entry
        setRecentAudits((prev) => [
          {
            id: `audit-${Date.now()}`,
            actorName: "Current User",
            note:
              changeReason.trim() ||
              `Updated configuration: Gold ceiling ${
                tierCeilings.find((t) => t.tier === CustomerTier.GOLD)?.maxDiscountPercent
              }%, High Risk threshold ${
                approvalThresholds.find((th) => th.riskLevel === RiskLevel.HIGH)?.minOveragePoints
              }pt`,
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 4),
        ]);
        setChangeReason("");
        setTimeout(() => setSavedSuccess(false), 5000);
      } else {
        setErrorMessage(res.error || "Failed to save configuration.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-[#1f0b0e] p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-200 shadow-2xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>
            <strong>Error:</strong> {errorMessage}
          </span>
        </div>
      )}

      {/* Top 2 Cards: Tier Discount Ceilings & Category Discount Ceilings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Card 1: Tier Discount Ceilings */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 shadow-2xs transition-colors duration-150 space-y-4">
          <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-3">
            <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
              Tier Discount Ceilings
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
              Maximum allowable manual discount by customer tier
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#ebebeb] dark:border-[#262626]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3 text-right">Max Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
                {tierCeilings.map((item) => (
                  <tr
                    key={item.tier}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#171717] dark:text-[#ededed]">
                      {item.label}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.maxDiscountPercent}
                          onChange={(e) => handleTierChange(item.tier, e.target.value)}
                          required
                          className="w-20 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-2.5 py-1.5 text-sm text-right font-medium text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                        />
                        <span className="text-xs font-semibold text-[#737373] dark:text-[#a1a1a1]">
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Category Discount Ceilings */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 shadow-2xs transition-colors duration-150 space-y-4">
          <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-3">
            <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
              Category Discount ceilings
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
              Maximum allowable discount ceiling by product category
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#ebebeb] dark:border-[#262626]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Max Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
                {categoryCeilings.map((item) => (
                  <tr
                    key={item.category}
                    className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#171717] dark:text-[#ededed]">
                      {item.label}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.maxDiscountPercent}
                          onChange={(e) => handleCategoryChange(item.category, e.target.value)}
                          required
                          className="w-20 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-2.5 py-1.5 text-sm text-right font-medium text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                        />
                        <span className="text-xs font-semibold text-[#737373] dark:text-[#a1a1a1]">
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Card 3: Approval Chain Thresholds (Discount range → who approves) */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 shadow-2xs transition-colors duration-150 space-y-4">
        <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-3">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
            Discount range → who approves
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#a1a1a1] mt-0.5">
            Blended overage point thresholds determining the required governance sign-off chain
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#ebebeb] dark:border-[#262626]">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Discount range</th>
                <th className="px-6 py-3.5">Max Discount / Who Approves</th>
                <th className="px-6 py-3.5 text-right w-44">Min Overage Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
              {approvalThresholds.map((row) => (
                <tr
                  key={row.riskLevel}
                  className="hover:bg-neutral-50/70 dark:hover:bg-[#141414] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-[#171717] dark:text-[#ededed]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          row.riskLevel === RiskLevel.LOW
                            ? "bg-emerald-500"
                            : row.riskLevel === RiskLevel.MEDIUM
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span>{row.rangeLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                        row.riskLevel === RiskLevel.LOW
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                          : row.riskLevel === RiskLevel.MEDIUM
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {row.whoApproves}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.riskLevel === RiskLevel.LOW ? (
                      <span className="text-xs text-[#737373] dark:text-[#a1a1a1] font-mono">
                        0.0 pt (within limit)
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span className="text-xs text-[#737373] dark:text-[#a1a1a1]">≥</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          max="50"
                          value={row.minOveragePoints}
                          onChange={(e) => handleThresholdChange(row.riskLevel, e.target.value)}
                          className="w-20 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-2.5 py-1 text-xs text-right font-medium text-[#171717] dark:text-[#ededed] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
                        />
                        <span className="text-xs text-[#737373] dark:text-[#a1a1a1] font-mono">
                          pts
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason for change (optional input for audit log) */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-5 shadow-2xs space-y-2 transition-colors">
        <label
          htmlFor="change-reason"
          className="block text-xs font-semibold text-[#171717] dark:text-[#ededed]"
        >
          Audit Log Note <span className="text-[#737373] dark:text-[#a1a1a1] font-normal">(optional)</span>
        </label>
        <input
          id="change-reason"
          type="text"
          placeholder="e.g. Approved Q3 discount policy adjustments for enterprise deals"
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          className="w-full rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#121212] px-3 py-2 text-xs text-[#171717] dark:text-[#ededed] placeholder:text-[#8f8f8f] focus:border-[#171717] dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white transition-colors"
        />
      </div>

      {/* Save Button & Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#0070f3] hover:bg-[#0761d1] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2 flex items-center gap-2"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          <span>{isSubmitting ? "Saving..." : "Save configuration"}</span>
        </button>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            Configuration saved and audit logged successfully
          </span>
        )}
      </div>

      {/* Exact Banner Notes matching screen18.png */}
      <div className="rounded-xl border border-amber-300/60 dark:border-amber-900/60 bg-amber-50/70 dark:bg-[#1a1608] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed shadow-2xs space-y-1">
        <p>
          When a quote mixes categories with different ceilings, the system must compute a blended risk score and route to the highest required level.
        </p>
        <p>All approvals, rejections, and edits must be logged with user, timestamp, and reason.</p>
      </div>

      {/* Audit Log History Panel */}
      <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] p-5 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#737373] dark:text-[#a1a1a1]" />
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
              Configuration Audit Trail
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#737373] dark:text-[#a1a1a1]">
            Action: CONFIG_CHANGED
          </span>
        </div>

        {recentAudits.length > 0 ? (
          <ul className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-xs">
            {recentAudits.map((item) => (
              <li key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-medium text-[#171717] dark:text-[#ededed]">
                    {item.actorName}:
                  </span>{" "}
                  <span className="text-[#737373] dark:text-[#a1a1a1]">{item.note}</span>
                </div>
                <span className="text-[#8f8f8f] text-[11px] font-mono shrink-0">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#737373] dark:text-[#a1a1a1] py-1">
            No previous configuration changes recorded in audit log.
          </p>
        )}
      </div>
    </form>
  );
}
