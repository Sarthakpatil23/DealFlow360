export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#fafafa]">
      <div className="w-full max-w-md rounded-xl border border-[#ebebeb] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-[#171717]" />
          <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
            DealFlow360
          </h1>
        </div>
        <p className="text-sm text-[#4d4d4d] leading-relaxed">
          B2B Sales Operations & CPQ platform. Next.js App Router, Tailwind CSS, and Prisma backend initialized successfully.
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-[#ebebeb] pt-4 text-xs text-[#8f8f8f]">
          <span>App Router: Ready</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      </div>
    </main>
  );
}
