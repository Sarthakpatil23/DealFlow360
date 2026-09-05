import Link from "next/link";
import { RecentActivityItem } from "@/lib/dashboard-data";

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="space-y-3" aria-labelledby="recent-activity-title">
      <h2
        id="recent-activity-title"
        className="text-base font-semibold text-[#0070f3] tracking-tight"
      >
        Recent Activity
      </h2>

      <ul className="space-y-2 text-sm text-[#171717] dark:text-[#ededed] list-none p-0 m-0">
        {activities.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="text-[#171717] dark:text-[#ededed] select-none font-normal" aria-hidden="true">
              –
            </span>
            <Link
              href={item.href}
              className="text-[#171717] dark:text-[#ededed] hover:text-[#0070f3] dark:hover:text-[#0070f3] transition-colors focus:outline-none focus:underline"
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
