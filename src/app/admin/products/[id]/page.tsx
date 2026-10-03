import EditProductPage from "@/features/admin/edit-product-page";

export default function EditProductRoute({
  params,
}: {
  params: { id: string };
}) {
  return <EditProductPage productId={params.id} />;
}
