import { http, publicGet } from "@/api/http";
import type { Paginated, Review } from "@/lib/types";

const PAGE_SIZE = "5";

export function listReviews(slug: string, cursor?: string) {
  const params = new URLSearchParams({ limit: PAGE_SIZE });
  if (cursor) params.set("cursor", cursor);
  return publicGet<Paginated<Review>>(
    `/api/products/${encodeURIComponent(slug)}/reviews?${params}`,
  );
}

// Saving again edits the same review. Only a buyer with a delivered order may review.
export function saveReview(slug: string, rating: number, comment: string) {
  return http.post(`/api/products/${encodeURIComponent(slug)}/reviews`, {
    rating,
    ...(comment && { comment }),
  });
}
