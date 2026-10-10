import { Star } from "lucide-react";

// Gold star rating with the review count; hidden before the first review.
export function RatingBadge({
  rating,
}: {
  rating: { average: number; count: number };
}) {
  if (rating.count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
      <span className="font-bold text-ink dark:text-gray-100">
        {rating.average.toFixed(1)}
      </span>
      ({rating.count.toLocaleString("en-IN")})
    </span>
  );
}
