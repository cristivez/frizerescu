import { useTranslations } from "next-intl";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isOpenSpec, type Location, type Weekday } from "@/data/locations";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";

const DAY_KEY: Record<Weekday, string> = {
  Monday: "mon",
  Tuesday: "tue",
  Wednesday: "wed",
  Thursday: "thu",
  Friday: "fri",
  Saturday: "sat",
  Sunday: "sun",
};

export function LocationCard({ location, locale }: { location: Location; locale: "ro" | "en" }) {
  const t = useTranslations("location");
  const td = useTranslations("days");

  const dayRange = (days: Weekday[]) =>
    days.length === 1
      ? td(DAY_KEY[days[0]])
      : `${td(DAY_KEY[days[0]])} – ${td(DAY_KEY[days[days.length - 1]])}`;

  return (
    // `group relative` + the name link's `after:absolute after:inset-0`
    // (below) is the "stretched link" pattern: the whole card navigates to the
    // location page, while the phone link and the action buttons — raised with
    // `relative z-10` — stay independently clickable. A card can't be a single
    // <a> because it already contains four links.
    <article className="group relative flex flex-col border border-line bg-bg-elevated p-6 transition-colors duration-200 hover:border-line-strong">
      <header>
        <h3 className="flex items-start justify-between gap-3 text-h3 font-semibold text-ink">
          <span>
            {/* The location pages are the redesign's core SEO asset; the
                stretched overlay makes the whole card a link to this one. */}
            <Link
              href={`/${location.slug}`}
              className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-accent-strong focus-visible:outline-none"
            >
              {location.name}
            </Link>
            {location.isNew && (
              <span className="ml-3 border border-accent px-2 py-0.5 align-middle text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
                {t("new")}
              </span>
            )}
          </span>
          <ArrowUpRight
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-1 shrink-0 text-ink-secondary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
          />
        </h3>
        <div className="mt-3">
          <RatingStars
            value={location.rating}
            count={location.reviewCount}
            label={t("ratingLabel", { rating: location.rating, count: location.reviewCount })}
          />
        </div>
      </header>

      <div className="mt-6 space-y-2 text-sm text-ink-secondary">
        <p className="flex gap-2">
          <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden="true" />
          <span>
            {location.address.street}, {location.address.locality}
            <br />
            {location.landmark[locale]}
          </span>
        </p>
        <p className="flex gap-2">
          <Phone size={18} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden="true" />
          {/* relative z-10: sits above the card's stretched-link overlay so the
              phone number is dialable, not swallowed by the card navigation. */}
          <a
            href={`tel:${location.phone}`}
            className="relative z-10 text-accent hover:text-accent-strong"
          >
            {location.phone}
          </a>
        </p>
      </div>

      <div className="mt-6">
        <h4 className="text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
          {t("hours")}
        </h4>
        <dl className="mt-2 space-y-1 text-sm">
          {location.hours.map((h) => (
            <div key={h.days.join()} className="flex justify-between gap-4">
              <dt className="text-ink-secondary">{dayRange(h.days)}</dt>
              <dd className="text-ink">
                {isOpenSpec(h) ? `${h.opens} – ${h.closes}` : t("closed")}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* relative z-10: the action buttons stay clickable above the card's
          stretched-link overlay. */}
      <div className="relative z-10 mt-8 flex flex-wrap gap-3">
        <Button href={location.meroUrl} external variant="primary" size="sm">
          {t("book")}
        </Button>
        <Button href={location.mapsUrl} external variant="secondary" size="sm">
          {t("directions")}
        </Button>
        <Button href={`tel:${location.phone}`} variant="outline" size="sm">
          {t("call")}
        </Button>
      </div>
    </article>
  );
}
