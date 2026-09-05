import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-10 bg-background text-foreground transition-colors duration-200">
      <AuthScreen />
    </main>
  );
}
