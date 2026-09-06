import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";

export default function PriceFieldsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-[#737373] dark:text-[#a1a1a1]">
              <Link href="/products" className="hover:underline">
                Products
              </Link>
              <span>/</span>
              <span>Price Fields</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
              Manage Price Fields & Tiers
            </h1>
            <p className="text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
              Configure price adjustment rules and currency settings across Bronze, Silver, and Gold tiers
            </p>
          </div>
          <Link
            href="/products"
            className="border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Product Catalog
          </Link>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 text-sm text-[#737373] dark:text-[#a1a1a1]">
          <p>
            Price fields management interface. Click{" "}
            <Link href="/products" className="text-[#0070f3] underline">
              Back to Product Catalog
            </Link>{" "}
            to return to the catalog.
          </p>
        </div>
      </main>
    </div>
  );
}
