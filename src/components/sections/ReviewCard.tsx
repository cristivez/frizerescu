import { getLocation, type Location } from "@/data/locations";
import type { Review } from "@/data/reviews";
import { RatingStars } from "@/components/ui/RatingStars";

export function ReviewCard({
  review,
  locale,
  showLocation = true,
}: {
  review: Review;
  locale: "ro" | "en";
  /** The homepage mixes reviews from all shops, so it names each one. A single
   *  location page shows only its own reviews, where the name is redundant. */
  showLocation?: boolean;
}) {
  const shop = getLocation(review.location) as Location;
  return (
    <figure className="flex h-full flex-col border border-line bg-bg-elevated p-6">
      <RatingStars value={review.rating} label={`${review.rating} / 5 — ${review.author}`} />
      <blockquote className="mt-4 flex-1 text-ink-secondary">
        <p>{review.text[locale]}</p>
      </blockquote>
      <figcaption className="mt-6 text-sm">
        <span className="text-ink">{review.author}</span>
        {showLocation && <span className="text-ink-secondary"> · {shop.name}</span>}
      </figcaption>
    </figure>
  );
}
