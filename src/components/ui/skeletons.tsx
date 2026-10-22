// Grey placeholder of one product card.
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] bg-white shadow-card">
      <div className="h-[162px] bg-soft" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-4/5 rounded bg-line" />
        <div className="h-3 w-3/5 rounded bg-line" />
        <div className="h-5 w-2/5 rounded bg-line" />
        <div className="mt-2 h-9 rounded-[10px] bg-soft" />
      </div>
    </div>
  );
}

// Placeholder product grid while a list loads.
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

// Placeholder product row while a row loads.
export function RowSkeleton() {
  return (
    <div className="scroll-row">
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

// Placeholder cards while a page loads.
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card h-28 animate-pulse" />
      ))}
    </div>
  );
}
