import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sales Dashboard — DealFlow360",
  description: "Central hub for internal users and sales operations",
};

export default async function SalesDashboardPage() {
  const { summaryCards, recentActivities } = await getDashboardData();

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] flex flex-col font-sans">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Dashboard Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Header Section */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717]">
            Sales Dashboard / Home
          </h1>
          <p className="text-sm text-[#737373]">
            Central hub, links out to every module below
          </p>
        </header>

        {/* 3 Summary Cards Grid */}
        <section
          aria-label="Summary Overview"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.id}
              title={card.title}
              metric={card.metric}
              href={card.href}
            />
          ))}
        </section>

        {/* Action Buttons */}
        <section
          aria-label="Quick Actions"
          className="flex flex-wrap items-center gap-3 pt-1"
        >
          <Link
            href="/quotations/new"
            className="inline-flex items-center justify-center bg-[#0070f3] text-white hover:bg-[#0761d1] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2"
          >
            + New Quotation
          </Link>

          <Link
            href="/approvals"
            className="inline-flex items-center justify-center bg-white border border-[#ebebeb] text-[#171717] hover:bg-neutral-50 hover:border-neutral-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2"
          >
            View Approvals
          </Link>
        </section>

        {/* Recent Activity Section */}
        <div className="pt-2">
          <RecentActivity activities={recentActivities} />
        </div>
      </main>
    </div>
  );
}
