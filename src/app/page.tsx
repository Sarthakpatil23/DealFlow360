import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/HeroSection";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "CUSTOMER") {
      redirect("/portal");
    }
    redirect("/dashboard");
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <HeroSection />
    </main>
  );
}
