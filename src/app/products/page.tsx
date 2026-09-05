import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { getProductCatalogData } from "@/lib/products-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Catalog — DealFlow360",
  description: "Every product, variant and price list in one place",
};

export default async function ProductsPage() {
  const { summary, products } = await getProductCatalogData();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Page Header */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Product catalog
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#a1a1a1]">
            Every product, variant and price list in one place.
          </p>
        </header>

        {/* Action Buttons */}
        <section
          aria-label="Product Actions"
          className="flex flex-wrap items-center gap-3 pt-1"
        >
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center bg-[#0070f3] text-white hover:bg-[#0761d1] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2"
          >
            + New Product
          </Link>

          <Link
            href="/products/price-fields"
            className="inline-flex items-center justify-center bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] hover:border-neutral-300 dark:hover:border-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            Manage Price fields
          </Link>
        </section>

        {/* Summary Cards */}
        <section
          aria-label="Product Summary"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 transition-all duration-150">
            <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
              Total Products
            </h3>
            <p className="mt-3 text-sm text-[#737373] dark:text-[#a1a1a1] font-normal leading-relaxed">
              {summary.totalProducts}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 transition-all duration-150">
            <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
              Pricelists
            </h3>
            <p className="mt-3 text-sm text-[#737373] dark:text-[#a1a1a1] font-normal leading-relaxed">
              {summary.pricelists}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-6 transition-all duration-150">
            <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed] tracking-tight">
              Variants
            </h3>
            <p className="mt-3 text-sm text-[#737373] dark:text-[#a1a1a1] font-normal leading-relaxed">
              {summary.variants}
            </p>
          </div>
        </section>

        {/* Catalog Table Section */}
        <section className="space-y-4" aria-label="Products Table">
          <div className="flex items-center">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-md border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-sm font-semibold text-[#171717] dark:text-[#ededed]">
              Products
            </span>
          </div>

          <div className="border border-[#ebebeb] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#ebebeb] dark:border-[#262626] bg-[#f9fafb] dark:bg-[#121212] text-[#737373] dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Product name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Variants</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Unit</th>
                    <th className="px-6 py-3.5">Tax</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-[#171717] dark:text-[#ededed]">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-50 dark:hover:bg-[#141414] transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-[#171717] dark:text-[#ededed]">
                        <Link
                          href={`/products/${product.id}`}
                          className="block hover:text-[#0070f3] dark:hover:text-[#0070f3] focus:outline-none"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#737373] dark:text-[#a1a1a1]">
                        <Link href={`/products/${product.id}`} className="block">
                          {product.category}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#737373] dark:text-[#a1a1a1]">
                        <Link href={`/products/${product.id}`} className="block">
                          {product.variantsDisplay}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#171717] dark:text-[#ededed]">
                        <Link href={`/products/${product.id}`} className="block">
                          {product.priceDisplay}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#737373] dark:text-[#a1a1a1]">
                        <Link href={`/products/${product.id}`} className="block">
                          {product.unit}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#737373] dark:text-[#a1a1a1]">
                        <Link href={`/products/${product.id}`} className="block">
                          {product.tax}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/products/${product.id}`} className="inline-block">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            {product.status}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Banner Note matching screen16-17.png */}
          <div className="rounded-xl border border-amber-300/60 dark:border-amber-900/60 bg-amber-50/70 dark:bg-[#1a1608] p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed shadow-2xs">
            <p>
              Click a product row to open general info, variants and tier/currency price lists.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
