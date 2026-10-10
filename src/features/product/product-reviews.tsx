"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { deleteReview } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { listReviews, saveReview } from "@/api/review";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatDate } from "@/lib/format";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import type { Review } from "@/lib/types";
import { RatingBadge } from "@/components/product/rating-badge";

const RATINGS = [1, 2, 3, 4, 5];

// Reviews list; a buyer with a delivered order can write one.
export function ProductReviews({
  slug,
  rating,
}: {
  slug: string;
  rating: { average: number; count: number };
}) {
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const role = useAuthStore((state) => state.role);
  const [formOpen, setFormOpen] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const loadReviews = useCallback(
    (cursor?: string) => listReviews(slug, cursor),
    [slug],
  );
  const {
    items: reviews,
    setItems,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<Review>(loadReviews, inView);

  // Admin removes a review.
  async function removeReview(id: string) {
    if (!window.confirm("Remove this review?")) return;
    setRemovingId(id);
    try {
      await deleteReview(id);
      setItems((current) => current.filter((review) => review.id !== id));
      toast.success("Review removed");
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this review"));
    } finally {
      setRemovingId("");
    }
  }

  return (
    <section ref={ref} className="card mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            Ratings &amp; reviews
          </h2>
          <RatingBadge rating={rating} />
        </div>
        {loggedIn ? (
          <Button
            variant="outline"
            onClick={() => setFormOpen((open) => !open)}
          >
            {formOpen ? "Close" : "Write a review"}
          </Button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`}
            className="btn-outline"
          >
            Login to review
          </Link>
        )}
      </div>

      {formOpen && (
        <ReviewForm
          slug={slug}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      )}

      <div className="mt-6">
        {!inView || loading ? (
          <ListSkeleton count={2} />
        ) : failed ? (
          <p className="text-sm text-gray-500">
            Could not load reviews.{" "}
            <button
              type="button"
              onClick={reload}
              className="font-extrabold text-accent"
            >
              Retry
            </button>
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">
            No reviews yet. Buyers can review after delivery.
          </p>
        ) : (
          <ul className="divide-y divide-sand dark:divide-white/10">
            {reviews.map((review) => (
              <li key={review.id} className="py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <Stars value={review.rating} />
                  <span className="text-sm font-extrabold">
                    {review.user.name ?? "ApnaKart customer"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(review.createdAt)}
                  </span>
                  {isAdmin(role) && (
                    <Button
                      variant="danger"
                      onClick={() => removeReview(review.id)}
                      loading={removingId === review.id}
                      className="ml-auto px-2.5 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {cursor && (
          <div className="mt-4">
            <LoadMoreButton onClick={loadMore} loading={loadingMore} />
          </div>
        )}
      </div>
    </section>
  );
}

// Form to write or edit a review.
function ReviewForm({ slug, onSaved }: { slug: string; onSaved: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Saves the review.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveReview(slug, rating, comment.trim());
      toast.success("Thanks! Your review is saved.");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save your review"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 rounded-2xl bg-mist/60 p-4 dark:bg-white/[0.05]"
    >
      <fieldset>
        <legend className="text-sm font-extrabold">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={rating === value}
              className="grid h-10 w-10 place-items-center rounded-lg text-gold hover:bg-white dark:hover:bg-white/10"
            >
              <Star
                className={`h-6 w-6 ${value <= rating ? "fill-current" : ""}`}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="text-sm font-extrabold">Review (optional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="What did you like or dislike?"
          className="field mt-2 resize-y"
        />
      </label>
      <Button
        type="submit"
        loading={saving}
        disabled={
          rating === 0 ||
          (comment.trim().length > 0 && comment.trim().length < 3)
        }
        className="mt-4"
      >
        Submit review
      </Button>
    </form>
  );
}

// Clickable 1 to 5 star picker.
function Stars({ value }: { value: number }) {
  return (
    <span className="flex text-gold" aria-label={`${value} out of 5 stars`}>
      {RATINGS.map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= value ? "fill-current" : ""}`}
        />
      ))}
    </span>
  );
}
