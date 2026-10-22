"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReview } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { listReviews, saveReview } from "@/api/review";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { tintAt } from "@/lib/colors";
import { formatDate, ratingsText } from "@/lib/format";
import { loginHref } from "@/lib/links";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import type { ProductDetail, Review } from "@/lib/types";

const BAR_COLORS: Record<number, string> = {
  5: "#0B7A5C",
  4: "#4FA98C",
  3: "#E0A100",
  2: "#E07B2E",
  1: "#C7421F",
};

// Rating summary and reviews (loaded when scrolled near); buyers can write one, admins can remove.
export function ProductReviews({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const role = useAuthStore((state) => state.role);
  const [formStars, setFormStars] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState("");
  const totalRatings = product.ratingBars.reduce(
    (sum, bar) => sum + bar.count,
    0,
  );

  // Loads one page of reviews.
  const loadReviews = useCallback(
    (cursor?: string) => listReviews(product.slug, cursor),
    [product.slug],
  );
  const {
    items,
    setItems,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<Review>(loadReviews, inView);

  // Opens the review form with the tapped stars; guests go to login.
  function openForm(stars: number) {
    if (!loggedIn) router.push(loginHref(`/products/${product.slug}`));
    else setFormStars(stars);
  }

  // Admin only: removes a review after a confirm.
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
    <section ref={ref} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Ratings and reviews</h2>
        <button
          type="button"
          onClick={() => openForm(0)}
          className="btn-grey min-h-10 px-4 text-[15px]"
        >
          Write a review
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-[28px] bg-ink p-[22px] text-white">
        <div className="flex h-[136px] w-[136px] shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-white bg-sunny text-ink">
          <span className="text-[46px] font-extrabold leading-none">
            {product.rating.count > 0 ? product.rating.average.toFixed(1) : "–"}
          </span>
          <span className="font-semibold">out of 5</span>
        </div>
        <div className="flex flex-[2_1_240px] flex-col gap-2">
          {product.ratingBars.map((bar) => {
            const share = totalRatings
              ? Math.round((bar.count / totalRatings) * 100)
              : 0;
            return (
              <div key={bar.stars} className="flex items-center gap-2.5">
                <span className="w-7 font-semibold">{bar.stars}★</span>
                <span className="h-3 flex-1 rounded-full bg-ink-2">
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      width: `${share}%`,
                      background: BAR_COLORS[bar.stars],
                    }}
                  />
                </span>
                <span className="w-10 text-right">{share}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-[1_1_220px] flex-col gap-1.5">
          <p className="text-lg font-extrabold">Rate this product</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => openForm(stars)}
                aria-label={`${stars} star${stars > 1 ? "s" : ""}`}
                className={`h-11 w-11 text-4xl leading-none ${stars <= (formStars ?? 0) ? "text-sunny" : "text-[#35555A]"}`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-mint">{ratingsText(product.rating.count)}</p>
        </div>
      </div>

      {formStars !== null && (
        <ReviewForm
          key={formStars}
          slug={product.slug}
          startStars={formStars}
          onClose={() => setFormStars(null)}
          onSaved={() => {
            setFormStars(null);
            reload();
          }}
        />
      )}

      {!inView || loading ? (
        <ListSkeleton count={2} />
      ) : failed ? (
        <p className="font-semibold">
          Could not load reviews.{" "}
          <button
            type="button"
            onClick={reload}
            className="font-extrabold text-accent"
          >
            Retry
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-[20px] bg-white p-6 font-semibold text-muted">
          No reviews yet. Buyers can review after delivery.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {items.map((review, index) => {
            const name = review.user.name || "ApnaKart customer";
            return (
              <article
                key={review.id}
                className="flex flex-col gap-3 rounded-[26px] p-[18px]"
                style={{ background: tintAt(index + 2) }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-white text-[22px] font-extrabold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold">{name}</p>
                    <p className="text-sm">
                      Verified purchase · {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <p
                  aria-label={`${review.rating} out of 5 stars`}
                  className="text-2xl leading-none tracking-[2px]"
                >
                  <span className="text-discount">
                    {"★".repeat(review.rating)}
                  </span>
                  <span className="text-white">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </p>
                {review.comment && (
                  <p className="flex-1 text-lg font-semibold">
                    {review.comment}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="relative h-[76px] w-[76px] rounded-2xl bg-white">
                    <SafeImage
                      src={product.images[0]}
                      alt=""
                      sizes="76px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  {isAdmin(role) && (
                    <button
                      type="button"
                      onClick={() => removeReview(review.id)}
                      disabled={removingId === review.id}
                      className="min-h-11 rounded-full bg-white px-4 font-semibold text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
    </section>
  );
}

// Stars and comment form for the user's review.
function ReviewForm({
  slug,
  startStars,
  onClose,
  onSaved,
}: {
  slug: string;
  startStars: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(startStars);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const text = comment.trim();

  // Saves the review.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveReview(slug, rating, text);
      toast.success("Thanks! Your review is saved.");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save your review"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
      <fieldset className="flex flex-wrap items-center gap-1">
        <legend className="mb-1 font-extrabold">Your rating</legend>
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => setRating(stars)}
            aria-label={`${stars} star${stars > 1 ? "s" : ""}`}
            aria-pressed={rating === stars}
            className={`h-11 w-11 text-3xl leading-none ${stars <= rating ? "text-sunny" : "text-line"}`}
          >
            ★
          </button>
        ))}
      </fieldset>
      <label className="label">
        Review (optional)
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={3}
          className="field resize-y py-2.5"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          loading={saving}
          disabled={rating === 0 || (text.length > 0 && text.length < 3)}
        >
          Submit review
        </Button>
        <Button variant="line" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
