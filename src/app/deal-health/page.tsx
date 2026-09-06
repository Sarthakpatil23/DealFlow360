import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { evaluateDealHealth } from "@/lib/business-logic/deal-health";
import { DealHealthView } from "@/components/deal-health/deal-health-view";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deal Health & Anomaly Dashboard — DealFlow360",
  description: "Automated anomaly detection for stalled deals, discount overages, and delivery slippages",
};

export default async function DealHealthPage() {
  const session = await auth();

  // If customer visits, redirect to scoped customer portal
  if (session?.user?.role === "CUSTOMER") {
    redirect("/portal");
  }

  const role = (session?.user?.role as UserRole) || UserRole.REP;
  let userId = session?.user?.id;

  if (role === UserRole.REP && !userId) {
    const defaultRep = await prisma.user.findFirst({
      where: { role: UserRole.REP },
      select: { id: true },
    });
    if (defaultRep) userId = defaultRep.id;
  }

  const metrics = await evaluateDealHealth({ role, repId: userId });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav
        userEmail={session?.user?.email ?? undefined}
        userRole={role}
        userName={session?.user?.name ?? undefined}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DealHealthView
          initialData={metrics}
          currentUserRole={role}
          currentUserName={session?.user?.name ?? undefined}
        />
      </main>
    </div>
  );
}
