import { logoutAction } from "@/app/actions/auth-actions";

interface SessionCardProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    customerId?: string | null;
  };
}

export function SessionCard({ user }: SessionCardProps) {
  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    REP: "bg-blue-100 text-blue-800 border-blue-200",
    MANAGER: "bg-indigo-100 text-indigo-800 border-indigo-200",
    FINANCE: "bg-amber-100 text-amber-800 border-amber-200",
    CUSTOMER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const badgeClass = (user.role && roleColors[user.role]) || "bg-neutral-100 text-neutral-800 border-neutral-200";

  return (
    <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Authenticated Session</h2>
          <p className="text-xs text-neutral-500">Auth.js Credentials + JWT Cookie</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeClass}`}>
          {user.role ?? "UNKNOWN"}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between py-1 border-b border-neutral-50">
          <span className="text-neutral-500 font-medium">Name</span>
          <span className="font-semibold text-neutral-900">{user.name ?? "N/A"}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-neutral-50">
          <span className="text-neutral-500 font-medium">Email</span>
          <span className="font-mono text-neutral-800">{user.email ?? "N/A"}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-neutral-50">
          <span className="text-neutral-500 font-medium">User ID</span>
          <span className="font-mono text-[11px] text-neutral-600 truncate max-w-[200px]">{user.id ?? "N/A"}</span>
        </div>
        {user.customerId && (
          <div className="flex justify-between py-1 border-b border-neutral-50">
            <span className="text-neutral-500 font-medium">Customer Scope ID</span>
            <span className="font-mono text-[11px] text-neutral-600 truncate max-w-[200px]">{user.customerId}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-xs">Session active & persists across page refresh</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <a
          href="/dashboard"
          className="w-full inline-flex items-center justify-center rounded-md bg-[#171717] py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Enter Sales Dashboard (Screen 2) →
        </a>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-md border border-neutral-300 bg-white py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
