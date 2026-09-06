import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { DiscountConfigForm } from "@/components/discount-config/discount-config-form";
import { getDiscountConfigData } from "@/lib/discount-config-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discount Tiers & Approval Chain Setup — DealFlow360",
  description: "Screen 18: Configure tier discount ceilings, category discount ceilings, and approval chain thresholds",
};

export default async function DiscountApprovalSetupPage() {
  const data = await getDiscountConfigData();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Header with breadcrumbs and back button */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-1.5 text-xs text-[#737373] dark:text-[#a1a1a1]">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/approvals" className="hover:underline">
                Approvals
              </Link>
              <span>/</span>
              <span className="text-[#171717] dark:text-[#ededed] font-medium">
                Discount & Approval Setup
              </span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
              Discount tiers and approval chain setup
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
              Admin control panel for discount governance and approval chain thresholds
            </p>
          </div>

          <div>
            <Link
              href="/approvals"
              className="inline-flex items-center justify-center border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] hover:border-neutral-300 dark:hover:border-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs"
            >
              ← Back to Approvals
            </Link>
          </div>
        </header>

        {/* Screen 18 Configuration Form */}
        <DiscountConfigForm initialData={data} />
      </main>
    </div>
  );
}
