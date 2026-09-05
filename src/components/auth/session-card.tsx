import { logoutAction } from "@/app/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Layers, LogOut } from "lucide-react";

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
    ADMIN: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
    REP: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
    MANAGER: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
    FINANCE: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    CUSTOMER: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  };

  const badgeClass = (user.role && roleColors[user.role]) || "bg-muted text-muted-foreground border-border";

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary text-primary-foreground font-semibold shadow-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Authenticated Session</h2>
            <p className="text-xs text-muted-foreground">Auth.js Credentials + JWT Cookie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeClass}`}>
            {user.role ?? "UNKNOWN"}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between py-1.5 border-b border-border">
          <span className="text-muted-foreground font-medium">User Name</span>
          <span className="font-semibold text-foreground">{user.name ?? "N/A"}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-border">
          <span className="text-muted-foreground font-medium">Email</span>
          <span className="font-mono text-foreground">{user.email ?? "N/A"}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-border">
          <span className="text-muted-foreground font-medium">User ID</span>
          <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">{user.id ?? "N/A"}</span>
        </div>
        {user.customerId && (
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground font-medium">Customer Scope ID</span>
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">{user.customerId}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-xs">Session active & persists across page refresh</span>
        </div>
      </div>

      <form action={logoutAction} className="pt-2">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-[6px] border border-border bg-background py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </form>
    </div>
  );
}
