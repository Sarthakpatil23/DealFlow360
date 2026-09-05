import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen w-full bg-background">
      <AuthScreen />
    </main>
  );
}
