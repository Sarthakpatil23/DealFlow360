import Link from "next/link";

interface SummaryCardProps {
  title: string;
  metric: string;
  href: string;
}

export function SummaryCard({ title, metric, href }: SummaryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white border border-[#ebebeb] rounded-xl p-6 transition-all duration-150 hover:border-neutral-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2"
    >
      <h3 className="text-base font-semibold text-[#171717] tracking-tight transition-colors group-hover:text-black">
        {title}
      </h3>
      <p className="mt-3 text-sm text-[#737373] font-normal leading-relaxed">
        {metric}
      </p>
    </Link>
  );
}
