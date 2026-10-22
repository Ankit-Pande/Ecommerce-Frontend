// Shown while a product page loads.
export default function ProductLoading() {
  return (
    <>
      <div className="h-6 w-64 animate-pulse rounded-lg bg-white" />
      <div className="flex animate-pulse flex-wrap gap-6 rounded-[28px] bg-white p-4">
        <div className="h-[360px] flex-[1_1_300px] rounded-[22px] bg-soft" />
        <div className="flex flex-[1_1_320px] flex-col gap-4 p-2">
          <div className="h-9 w-4/5 rounded-lg bg-soft" />
          <div className="h-6 w-1/3 rounded-lg bg-soft" />
          <div className="h-[72px] rounded-[18px] bg-soft" />
          <div className="h-11 w-2/3 rounded-xl bg-soft" />
          <div className="h-40 rounded-[18px] bg-soft" />
        </div>
      </div>
    </>
  );
}
