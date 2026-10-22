import { EditProductPage } from "@/features/admin/edit-product-page";

// The /admin/products/:id page.
export default async function EditProductRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditProductPage productId={(await params).id} />;
}
