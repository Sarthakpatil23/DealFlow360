import { TopNav } from "@/components/navigation/top-nav";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { 
  getQuotationForBuilder, 
  getAvailableProductsList, 
  getAvailableCustomersList 
} from "@/app/actions/quotation-actions";

export default async function NewQuotationPage() {
  const quoteResult = await getQuotationForBuilder("new");
  const availableProducts = await getAvailableProductsList();
  const availableCustomers = await getAvailableCustomersList();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {quoteResult.data && (
          <QuotationBuilder
            initialData={quoteResult.data}
            availableProducts={availableProducts}
            availableCustomers={availableCustomers}
          />
        )}
      </main>
    </div>
  );
}
