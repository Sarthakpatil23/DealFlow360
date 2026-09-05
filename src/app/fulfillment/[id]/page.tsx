import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { getFulfillmentDetailData } from "@/lib/fulfillment-data";
import { FulfillmentDetailView } from "@/components/fulfillment/fulfillment-detail-view";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function FulfillmentDetailPage({ params }: PageProps) {
  const data = await getFulfillmentDetailData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <FulfillmentDetailView initialData={data} />
      </main>
    </div>
  );
}
