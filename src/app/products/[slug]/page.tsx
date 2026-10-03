import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductOnServer } from "@/api/catalog";
import { ProductDetails } from "@/features/catalog/product-details";
import { ProductUnavailable } from "@/features/catalog/product-unavailable";
import type { ProductDetail } from "@/lib/types";

type ProductPageProps = { params: { slug: string } };

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { data: product } = await getProductOnServer(params.slug);
  if (!product) return { title: "Product not found" };

  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

// Google reads price, stock and rating from this and can show them in results.
function productJsonLd(product: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    ...(product.brand && {
      brand: { "@type": "Brand", name: product.brand.name },
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.finalPricePaise / 100).toFixed(2),
      availability:
        product.stockStatus === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
    ...(product.rating.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.average,
        reviewCount: product.rating.count,
      },
    }),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { data: product, status } = await getProductOnServer(params.slug);
  if (status === 404) notFound();
  if (!product) return <ProductUnavailable />;

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so product text can never close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <ProductDetails product={product} />
    </>
  );
}
