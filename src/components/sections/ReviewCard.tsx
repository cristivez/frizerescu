import { getLocation, type Location } from "@/data/locations";
import type { Review } from "@/data/reviews";
import { RatingStars } from "@/components/ui/RatingStars";

export function ReviewCard({ review, locale }: { review: Review; locale: "ro" | "en" }) {
  const shop = getLocation(review.location) as Location;
  return (
    <figure className="flex h-full flex-col border border-line bg-bg-elevated p-6">
      <RatingStars value={review.rating} label={`${review.rating} / 5 — ${review.author}`} />
      <blockquote className="mt-4 flex-1 text-ink-secondary">
        <p>{review.text[locale]}</p>
      </blockquote>
      <figcaption className="mt-6 text-sm">
        <span className="text-ink">{review.author}</span>
        <span className="text-ink-secondary"> · {shop.name}</span>
      </figcaption>
    </figure>
  );
}
