import Link from "next/link";
import { AdminTitle } from "@/features/admin/admin-shell";
import { ProductForm } from "@/features/admin/product-form";

// Empty product form for a new product.
export function NewProductPage() {
  return (
    <>
      <AdminTitle title="Add product">
        <Link href="/admin/products" className="btn-line">
          ‹ Products
        </Link>
      </AdminTitle>
      <ProductForm />
    </>
  );
}
