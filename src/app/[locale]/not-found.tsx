import { useTranslations } from "next-intl";
import { locations } from "@/data/locations";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

// Localized 404 — keeps the header/footer chrome (it renders inside the
// locale layout) and gives lost visitors a path to booking instead of
// Next's default unstyled English dead end.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <section className="flex min-h-[70svh] items-center pt-[var(--header-h)]">
      <Container>
        <p className="text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">404</p>
        <h1 className="mt-4 font-display text-h1 tracking-[-0.015em] text-ink">{t("title")}</h1>
        <p className="mt-6 max-w-[48ch] text-body-lg text-ink-secondary">{t("description")}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/" variant="primary" size="lg">
            {t("home")}
          </Button>
        </div>
        <ul className="mt-10 space-y-2">
          {locations.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/${l.slug}`}
                className="inline-flex min-h-11 items-center text-accent hover:text-accent-strong"
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
