export function CardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-2/5 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}
