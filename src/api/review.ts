import { http, publicGet } from "@/api/http";
import type { Paginated, Review } from "@/lib/types";

// One page (6) of a product's reviews.
export function listReviews(slug: string, cursor?: string) {
  const params = new URLSearchParams({ limit: "6" });
  if (cursor) params.set("cursor", cursor);
  return publicGet<Paginated<Review>>(
    `/api/products/${encodeURIComponent(slug)}/reviews?${params}`,
  );
}

// Adds or changes the user's review.
export function saveReview(slug: string, rating: number, comment: string) {
  return http.post(`/api/products/${encodeURIComponent(slug)}/reviews`, {
    rating,
    ...(comment && { comment }),
  });
}
