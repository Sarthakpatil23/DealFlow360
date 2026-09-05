import { TopNav } from "@/components/navigation/top-nav";
import { evaluateDealHealth } from "@/lib/business-logic/deal-health";
import { DealHealthView } from "@/components/deal-health/deal-health-view";

export const dynamic = "force-dynamic";

export default async function DealHealthPage() {
  const metrics = await evaluateDealHealth();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DealHealthView initialData={metrics} />
      </main>
    </div>
  );
}
