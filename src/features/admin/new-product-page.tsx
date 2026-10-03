import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { emptyProduct, ProductForm } from "@/features/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="btn-ghost -ml-3 mb-3">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <h2 className="mb-5 font-display text-2xl font-bold">Create product</h2>
      <ProductForm initial={emptyProduct} />
    </div>
  );
}
