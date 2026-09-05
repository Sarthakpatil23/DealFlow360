import { TopNav } from "@/components/navigation/top-nav";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { 
  getQuotationForBuilder, 
  getAvailableProductsList, 
  getAvailableCustomersList 
} from "@/app/actions/quotation-actions";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function QuotationDetailPage({ params }: PageProps) {
  const quoteResult = await getQuotationForBuilder(params.id);
  const availableProducts = await getAvailableProductsList();
  const availableCustomers = await getAvailableCustomersList();

  if (!quoteResult.success || !quoteResult.data) {
    // If not found by ID, attempt to return default Q-1042 view or notFound
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
        <TopNav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
            <h2 className="font-semibold text-base mb-1">Quotation Not Found</h2>
            <p>Could not find quotation with ID or code &quot;{params.id}&quot;.</p>
            <div className="mt-4">
              <Link href="/quotations" className="underline font-medium">
                ← Return to Quotations List
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <QuotationBuilder
          initialData={quoteResult.data}
          availableProducts={availableProducts}
          availableCustomers={availableCustomers}
        />
      </main>
    </div>
  );
}
