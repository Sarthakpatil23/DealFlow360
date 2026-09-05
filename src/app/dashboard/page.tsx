import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardData } from "@/lib/dashboard-data";
import { UserRole } from "@prisma/client";

import { PersonaSwitcher } from "@/components/navigation/persona-switcher";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — DealFlow360",
  description: "Role-adaptive central hub for sales operations, management, and finance",
};

export default async function SalesDashboardPage() {
  const session = await auth();

  // If customer visits internal dashboard, redirect to customer portal
  if (session?.user?.role === "CUSTOMER") {
    redirect("/portal");
  }

  const userRole = (session?.user?.role as UserRole) || UserRole.REP;
  const userContext = session?.user
    ? {
        id: session.user.id,
        role: userRole,
        name: session.user.name,
      }
    : undefined;

  const { roleBadge, summaryCards, quickActions, recentActivities } =
    await getDashboardData(userContext);

  let pageHeading = "Sales Representative Pipeline";
  if (userRole === UserRole.MANAGER) {
    pageHeading = "Sales Manager Oversight & Approvals";
  } else if (userRole === UserRole.FINANCE) {
    pageHeading = "Finance & Operations Console";
  } else if (userRole === UserRole.ADMIN) {
    pageHeading = "System Administration & Governance";
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      {/* Top Navigation with Role Awareness */}
      <TopNav currentRole={userRole} currentName={session?.user?.name} />

      {/* Main Dashboard Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">
        {/* Persona Switcher Simulator Bar */}
        <PersonaSwitcher currentRole={userRole} currentName={session?.user?.name} />

        {/* Header Section */}
        <header className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
                  {pageHeading}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadge.colorClass}`}
                >
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-sm text-[#737373] dark:text-[#a1a1a1] mt-1">
                {roleBadge.description}
              </p>
            </div>

            {session?.user && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Logged in as: <strong>{session.user.name || session.user.email}</strong>
                  </span>
                </span>
              </div>
            )}
          </div>
        </header>

        {/* 3 Role-Tailored Summary Cards Grid */}
        <section
          aria-label="Summary Overview"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.id}
              title={card.title}
              metric={card.metric}
              subtitle={card.subtitle}
              href={card.href}
            />
          ))}
        </section>

        {/* Dynamic Role-Relevant Quick Action Buttons */}
        <section
          aria-label="Quick Actions"
          className="flex flex-wrap items-center gap-3 pt-1"
        >
          {quickActions.map((action, idx) =>
            action.variant === "primary" ? (
              <Link
                key={idx}
                href={action.href}
                className="inline-flex items-center justify-center bg-[#0070f3] text-white hover:bg-[#0761d1] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2"
              >
                {action.label}
              </Link>
            ) : (
              <Link
                key={idx}
                href={action.href}
                className="inline-flex items-center justify-center bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] hover:border-neutral-300 dark:hover:border-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
              >
                {action.label}
              </Link>
            )
          )}
        </section>

        {/* Recent Activity Section */}
        <div className="pt-2">
          <RecentActivity activities={recentActivities} />
        </div>
      </main>
    </div>
  );
}
