import { auth } from "@/auth";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth-actions";
import { ShieldX, ArrowLeft, LogOut } from "lucide-react";

export default async function UnauthorizedPage() {
  const session = await auth();

  const destination =
    session?.user?.role === "CUSTOMER" ? "/portal" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100">
          <ShieldX className="h-6 w-6" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-red-600 font-semibold">
            403 Forbidden — Access Denied
          </span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
            Restricted Area
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            Your current role{" "}
            <span className="font-semibold text-neutral-800">
              ({session?.user?.role || "UNKNOWN"})
            </span>{" "}
            does not have clearance to access this module or operational resource.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link
            href={destination}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Authorized Area
          </Link>

          <form action={logoutAction} className="w-full sm:w-auto">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
