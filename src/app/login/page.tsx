import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "CUSTOMER") {
      redirect("/portal");
    }
    const target =
      searchParams?.callbackUrl &&
      searchParams.callbackUrl !== "/" &&
      !searchParams.callbackUrl.startsWith("/login")
        ? searchParams.callbackUrl
        : "/dashboard";
    redirect(target);
  }

  return (
    <main className="min-h-screen w-full bg-background">
      <AuthScreen callbackUrl={searchParams?.callbackUrl} />
    </main>
  );
}
