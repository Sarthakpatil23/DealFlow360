import { TopNav } from "@/components/navigation/top-nav";
import { getApprovalsListData } from "@/lib/approval-data";
import { ApprovalsListView } from "@/components/approvals/approvals-list-view";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const data = await getApprovalsListData();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ApprovalsListView initialData={data} />
      </main>
    </div>
  );
}
