import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";

export default function QuotationsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
              Screen 3 — Quotations List (Pipeline)
            </h1>
            <p className="text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
              Active deal pipeline grouped by stage (Draft, Pending Approval, Approved, Negotiation, Confirmed)
            </p>
          </div>
          <Link
            href="/quotations/new"
            className="bg-[#0070f3] text-white hover:bg-[#0761d1] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Quotation
          </Link>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 text-sm text-[#737373] dark:text-[#a1a1a1]">
          <p>
            Pipeline view placeholder for navigation. Click{" "}
            <Link href="/dashboard" className="text-[#0070f3] underline">
              Dashboard
            </Link>{" "}
            to return to Screen 2.
          </p>
        </div>
      </main>
    </div>
  );
}
