import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";

export default function NewQuotationPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-[#737373] dark:text-[#a1a1a1]">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/quotations" className="hover:underline">
                Quotations
              </Link>
              <span>/</span>
              <span>New</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
              Screen 4 — Quotation Builder (New Quotation)
            </h1>
            <p className="text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
              Blank builder to configure order lines, live discount validation, and upsell rules
            </p>
          </div>
          <Link
            href="/dashboard"
            className="border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 text-sm text-[#737373] dark:text-[#a1a1a1]">
          <p>
            Quotation Builder placeholder for navigation from <code>+ New Quotation</code> action.
          </p>
        </div>
      </main>
    </div>
  );
}
