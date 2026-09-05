import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionCard } from "@/components/auth/session-card";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground transition-colors duration-200">
      <header className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          DealFlow360
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          B2B Sales Operations Platform
        </p>
      </header>

      <SessionCard user={session.user} />
    </main>
  );
}
