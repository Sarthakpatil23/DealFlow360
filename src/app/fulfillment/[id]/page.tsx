import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";

interface PageProps {
  params: { id: string };
}

export default function FulfillmentDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] flex flex-col font-sans">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-[#737373]">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/fulfillment" className="hover:underline">
                Fulfillment
              </Link>
              <span>/</span>
              <span>{params.id}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717]">
              Screen 8 — Fulfillment Detail ({params.id})
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Warehouse split allocation, backorder consolidation, and shipment tracking
            </p>
          </div>
          <Link
            href="/dashboard"
            className="border border-[#ebebeb] bg-white text-[#171717] hover:bg-neutral-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl p-6 text-sm text-[#737373]">
          <p>
            Fulfillment detail placeholder for order <strong>{params.id}</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
