import { Star } from "lucide-react";

// Green rating chip; hidden before the first review.
export function RatingBadge({
  rating,
}: {
  rating: { average: number; count: number };
}) {
  if (rating.count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500">
      <span className="inline-flex items-center gap-0.5 rounded-md bg-leaf px-1.5 py-0.5 text-[11px] font-extrabold text-white">
        {rating.average.toFixed(1)}
        <Star className="h-3 w-3 fill-current" />
      </span>
      ({rating.count.toLocaleString("en-IN")})
    </span>
  );
}
