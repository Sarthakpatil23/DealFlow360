import { TopNav } from "@/components/navigation/top-nav";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { 
  getQuotationForBuilder, 
  getAvailableProductsList, 
  getAvailableCustomersList 
} from "@/app/actions/quotation-actions";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function NewQuotationPage() {
  const quoteResult = await getQuotationForBuilder("new");
  const availableProducts = await getAvailableProductsList();
  const availableCustomers = await getAvailableCustomersList();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {quoteResult.data ? (
          <QuotationBuilder
            initialData={quoteResult.data}
            availableProducts={availableProducts}
            availableCustomers={availableCustomers}
          />
        ) : (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive max-w-xl mx-auto mt-12">
            <div className="flex items-center gap-2 mb-2 font-semibold text-base">
              <AlertCircle className="h-5 w-5" />
              <span>Unable to Initialize New Quotation</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {quoteResult.error || "An unexpected error occurred while preparing the quotation template."}
            </p>
            <Link
              href="/quotations"
              className="inline-flex items-center text-xs font-semibold underline underline-offset-4"
            >
              ← Back to Quotations List
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
