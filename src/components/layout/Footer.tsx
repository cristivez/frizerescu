import { useTranslations } from "next-intl";
import { locations } from "@/data/locations";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

/**
 * lucide-react dropped the Facebook/Instagram brand marks (deprecated, then
 * removed — see lucide-icons/lucide#1867), so `lucide-react` has no such
 * exports to import here. These two are the same path data from lucide's
 * last release that shipped them (lucide-static@0.290.0), kept local since
 * they're only used in this one place. Same stroke API (size/strokeWidth)
 * as every other icon in this file, so they drop in without changing how
 * they're called below.
 */
function Facebook({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Instagram({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer({ locale }: { locale: "ro" | "en" }) {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-line bg-bg">
      <Container className="py-compact">
        <div className="grid gap-10 md:grid-cols-3">
          {locations.map((l) => (
            <div key={l.slug}>
              <h2 className="text-h3 font-semibold text-ink">
                <Link href={`/${l.slug}`}>{l.name}</Link>
              </h2>
              <address className="mt-3 not-italic text-sm leading-relaxed text-ink-secondary">
                {l.address.street}
                <br />
                {l.address.locality}, {l.address.region}
                <br />
                {l.landmark[locale]}
              </address>
              <a
                href={`tel:${l.phone}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:text-accent-strong"
              >
                {l.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 border-t border-line pt-8">
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/Frizerescu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink-secondary hover:text-ink"
            >
              <Facebook size={20} strokeWidth={1.5} />
            </a>
            <a
              href="https://www.instagram.com/frizerescu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink-secondary hover:text-ink"
            >
              <Instagram size={20} strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-sm text-ink-secondary">{t("copyright")}</p>
        </div>
      </Container>
    </footer>
  );
}
