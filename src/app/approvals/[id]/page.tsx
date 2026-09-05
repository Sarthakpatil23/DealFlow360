import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { getApprovalDetailData } from "@/lib/approval-data";
import { ApprovalDetailView } from "@/components/approvals/approval-detail-view";

import { auth } from "@/auth";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function ApprovalDetailPage({ params }: PageProps) {
  const session = await auth();
  const data = await getApprovalDetailData(params.id, session?.user?.role);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
        <TopNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-8 text-center max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Quotation Not Found
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Could not find quotation matching &quot;{params.id}&quot;.
            </p>
            <Link
              href="/approvals"
              className="mt-4 inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Approvals Queue
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ApprovalDetailView initialData={data} />
      </main>
    </div>
  );
}

