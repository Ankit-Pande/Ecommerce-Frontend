// Loading screen for a product page.
export default function ProductLoading() {
  return (
    <div className="card mt-6 grid animate-pulse gap-7 p-5 md:grid-cols-2 md:p-7">
      <div className="h-72 rounded-xl bg-gray-200 sm:h-96" />
      <div className="space-y-4">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-8 w-3/4 rounded bg-gray-200" />
        <div className="h-8 w-2/5 rounded bg-gray-200" />
        <div className="h-24 rounded bg-gray-200" />
        <div className="h-12 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
