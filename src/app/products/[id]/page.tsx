import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { ProductDetailsForm } from "@/components/products/product-details-form";
import { getProductDetailData } from "@/lib/products-data";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const product = await getProductDetailData(params.id);
  return {
    title: product ? `${product.name} — Product Details` : "Product Details — DealFlow360",
    description: "Product and pricelist configuration",
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProductDetailData(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex flex-col font-sans transition-colors duration-150">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Header with breadcrumb and back button */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-1.5 text-xs text-[#737373] dark:text-[#a1a1a1]">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:underline">
                Products
              </Link>
              <span>/</span>
              <span className="text-[#171717] dark:text-[#ededed] font-medium">
                {product.name}
              </span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
              Product and pricelist
            </h1>
          </div>

          <div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center border border-[#ebebeb] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] hover:bg-neutral-50 dark:hover:bg-[#171717] hover:border-neutral-300 dark:hover:border-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs"
            >
              ← Back to Product Catalog
            </Link>
          </div>
        </header>

        {/* Product Details & Pricelist Form */}
        <ProductDetailsForm initialData={product} />
      </main>
    </div>
  );
}
