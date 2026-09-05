import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";

export default function QuotationsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] flex flex-col font-sans">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717]">
              Screen 3 — Quotations List (Pipeline)
            </h1>
            <p className="text-sm text-[#737373] mt-1">
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

        <div className="bg-white border border-[#ebebeb] rounded-xl p-6 text-sm text-[#737373]">
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
