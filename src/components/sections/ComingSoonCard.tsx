import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { UpcomingLocation } from "@/data/upcoming-locations";
import { Button } from "@/components/ui/Button";

export function ComingSoonCard({
  location,
  locale,
}: {
  location: UpcomingLocation;
  locale: "ro" | "en";
}) {
  const t = useTranslations("upcoming");

  return (
    <article className="group relative flex flex-col overflow-hidden border border-dashed border-line bg-bg-elevated transition-colors duration-200 hover:border-line-strong">
      {location.image && (
        // ILLUSTRATIVE construction photo, not this shop — the alt says so.
        // Sits under the stretched-link overlay, so tapping it navigates.
        <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-line">
          <Image
            src={location.image}
            alt={t("imageAlt")}
            fill
            sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <header>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-accent">
            {t("badge")}
          </p>
          <h3 className="mt-3 flex items-start justify-between gap-3 text-h3 font-semibold text-ink">
            <span>
              <Link
                href={`/${location.slug}`}
                className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-accent-strong focus-visible:outline-none"
              >
                {location.name}
              </Link>
            </span>
            <ArrowUpRight
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-1 shrink-0 text-ink-secondary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
            />
          </h3>
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
        </div>

        <p className="mt-6 text-sm font-medium text-ink">{location.opening[locale]}</p>

        <div className="relative z-10 mt-auto flex flex-wrap gap-3 pt-8">
          <Button href={location.followUrl} external variant="primary" size="sm">
            {t("follow")}
          </Button>
        </div>
      </div>
    </article>
  );
}
