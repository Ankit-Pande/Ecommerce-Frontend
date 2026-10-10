"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { deleteReview } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { listReviews, saveReview } from "@/api/review";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatDate, tintFor } from "@/lib/format";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import type { Review } from "@/lib/types";

const RATINGS = [5, 4, 3, 2, 1];

// Rating summary, review cards and the review form for buyers.
export function ProductReviews({
  slug,
  image,
  rating,
}: {
  slug: string;
  image: string | null;
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
    <section ref={ref} className="card flex flex-wrap gap-7 rounded-[28px] p-6">
      <div className="flex flex-[1_1_240px] flex-col gap-1.5">
        <h2 className="text-[26px] font-extrabold">Ratings and reviews</h2>
        <p className="text-[44px] font-extrabold leading-tight">
          ★ {rating.count > 0 ? rating.average.toFixed(1) : "–"}
        </p>
        <p className="text-muted">
          {rating.count.toLocaleString("en-IN")}{" "}
          {rating.count === 1 ? "rating" : "ratings"}
        </p>
        {/* Bars count the reviews loaded below; the API sends no breakdown. */}
        {RATINGS.map((stars) => {
          const share = reviews.length
            ? reviews.filter((review) => review.rating === stars).length /
              reviews.length
            : 0;
          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="w-7">{stars}★</span>
              <span className="h-2 flex-1 rounded-full bg-ground">
                <span
                  className="block h-2 rounded-full bg-accent"
                  style={{ width: `${share * 100}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-[2_1_320px] flex-col gap-3">
        {!inView || loading ? (
          <ListSkeleton count={2} />
        ) : failed ? (
          <p className="text-muted">
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
          <p className="text-muted">
            No reviews yet. Buyers can review after delivery.
          </p>
        ) : (
          reviews.map((review) => {
            const name = review.user.name ?? "ApnaKart customer";
            return (
              <article
                key={review.id}
                className="flex gap-3 rounded-2xl bg-soft p-3"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl font-extrabold"
                  style={{ background: tintFor(review.user.id) }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    {name}
                    <span className="rounded-full bg-accent px-2 py-px text-[13px] text-white">
                      ★ {review.rating}
                    </span>
                    <span className="text-[#8A5A00]">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                    <span className="text-sm font-semibold text-muted">
                      {formatDate(review.createdAt)}
                    </span>
                  </p>
                  {review.comment && <p>{review.comment}</p>}
                  {isAdmin(role) && (
                    <button
                      type="button"
                      onClick={() => removeReview(review.id)}
                      disabled={removingId === review.id}
                      className="btn-grey mt-2 text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span
                  className="relative h-[60px] w-[60px] shrink-0 self-start rounded-xl"
                  style={{ background: tintFor(slug) }}
                >
                  <SafeImage
                    src={image}
                    alt=""
                    sizes="60px"
                    className="object-contain p-1"
                  />
                </span>
              </article>
            );
          })
        )}
        {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}

        {loggedIn ? (
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="btn-grey self-start"
          >
            {formOpen ? "Close" : "Write a review"}
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`}
            className="btn-grey self-start"
          >
            Write a review
          </Link>
        )}
        {formOpen && (
          <ReviewForm
            slug={slug}
            onSaved={() => {
              setFormOpen(false);
              reload();
            }}
          />
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
      className="flex flex-col gap-3 rounded-2xl bg-soft p-4"
    >
      <fieldset className="flex flex-wrap items-center gap-1">
        <legend className="mb-1 font-extrabold">Your rating</legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            aria-pressed={rating === value}
            className="h-11 w-11 rounded-xl text-2xl text-[#8A5A00] hover:bg-white"
          >
            {value <= rating ? "★" : "☆"}
          </button>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="font-extrabold">Review (optional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={3}
          className="field resize-y py-2.5"
        />
      </label>
      <Button
        type="submit"
        loading={saving}
        disabled={
          rating === 0 ||
          (comment.trim().length > 0 && comment.trim().length < 3)
        }
        className="self-start"
      >
        Submit review
      </Button>
    </form>
  );
}
