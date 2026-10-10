// Loading screen for a product page.
export default function ProductLoading() {
  return (
    <div className="flex animate-pulse flex-wrap gap-6">
      <div className="h-[400px] flex-[1_1_300px] rounded-[28px] bg-white" />
      <div className="h-[400px] flex-[1_1_320px] rounded-[28px] bg-white" />
    </div>
  );
}
