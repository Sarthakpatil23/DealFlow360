import Link from "next/link";

interface SummaryCardProps {
  title: string;
  metric: string;
  href: string;
  subtitle?: string;
}

export function SummaryCard({ title, metric, href, subtitle }: SummaryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 transition-all duration-150 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
    >
      <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight transition-colors group-hover:text-black dark:group-hover:text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm text-[#737373] dark:text-[#a1a1a1] font-normal leading-relaxed">
        {metric}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-[#a1a1a1] dark:text-[#737373] leading-normal">
          {subtitle}
        </p>
      )}
    </Link>
  );
}
