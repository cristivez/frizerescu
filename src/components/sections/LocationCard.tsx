import { useTranslations } from "next-intl";
import { MapPin, Phone } from "lucide-react";
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
    <article className="flex flex-col border border-line bg-bg-elevated p-6 transition-colors duration-200 hover:border-line-strong">
      <header>
        <h3 className="text-h3 font-semibold text-ink">
          {location.name}
          {location.isNew && (
            <span className="ml-3 border border-accent px-2 py-0.5 align-middle text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
              {t("new")}
            </span>
          )}
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
          <a href={`tel:${location.phone}`} className="text-accent hover:text-accent-strong">
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

      <div className="mt-8 flex flex-wrap gap-3">
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
