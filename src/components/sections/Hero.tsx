import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { RazorWipe } from "@/components/motion/RazorWipe";

/**
 * The hero photograph. Set to a path under /public once the real shot lands
 * (2560x1440, per docs/design/DESIGN-SYSTEM.md §12). While it is null the hero
 * shows an intentional empty state — a faint razor-blade watermark on the
 * surface-muted band — instead of next/image's broken-image icon.
 */
const HERO_IMAGE: string | null = null;

export function Hero({ meroUrl }: { meroUrl: string }) {
  const t = useTranslations("hero");
  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden bg-surface-muted">
      {HERO_IMAGE ? (
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Logo className="w-[min(70%,720px)] text-line" />
        </div>
      )}
      {/* Scrim: bottom-up so the wordmark and CTAs stay legible over any photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent"
      />
      <Container className="relative pb-section pt-[var(--header-h)]">
        <RazorWipe>
          <h1 className="font-display text-display tracking-[-0.015em] text-ink">FRIZERESCU</h1>
        </RazorWipe>
        <p className="mt-4 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
          {t("tagline")}
        </p>
        <p className="mt-6 max-w-[48ch] text-body-lg text-ink-secondary">{t("description")}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href={meroUrl} external variant="primary" size="lg">
            {t("book")}
          </Button>
          <Button href="/#locations" variant="secondary" size="lg">
            {t("locations")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
