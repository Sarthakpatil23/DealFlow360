import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#fafafa]">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded bg-neutral-900" />
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            DealFlow360
          </h1>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          Sign in to your account
        </p>
      </header>

      <LoginForm />
    </main>
  );
}
