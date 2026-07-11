"use client";

import { useLocale, useTranslations } from "next-intl";
import { verifiedTotals } from "@/data/locations";
import { CountUp } from "@/components/motion/CountUp";
import { Container } from "@/components/ui/Container";

/**
 * Reviews and rating come from verifiedTotals(), which sums only the
 * locations whose review counts were actually checked, and weights the
 * rating by review count. The numbers cannot disagree with the JSON-LD
 * because both read the same data module.
 */
export function StatBand() {
  const t = useTranslations("stats");
  const locale = useLocale();
  const { reviews, rating, locations } = verifiedTotals();
  // Format numbers in the page's own locale: ro renders "5.801" / "4,99",
  // en renders "5,801" / "4.99". A fixed ro-RO formatter on /en makes an
  // English reader misread the thousands separator.
  const intlLocale = locale === "ro" ? "ro-RO" : "en-GB";
  const nf = new Intl.NumberFormat(intlLocale);
  const rf = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const items = [
    { value: reviews, format: (n: number) => nf.format(Math.round(n)), label: t("reviews") },
    { value: rating, format: (n: number) => rf.format(n), label: t("rating") },
    { value: locations, format: (n: number) => String(Math.round(n)), label: t("locations") },
  ];

  return (
    <Container>
      <dl className="grid grid-cols-1 gap-10 border-y border-line py-compact sm:grid-cols-3">
        {items.map((item) => (
          // HTML requires dt before dd within a group; flex-col-reverse keeps
          // the number visually on top without invalid element order.
          <div key={item.label} className="flex flex-col-reverse gap-2 text-center">
            <dt className="text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
              {item.label}
            </dt>
            <dd className="font-display text-h1 tracking-[-0.015em] text-ink">
              <CountUp value={item.value} format={item.format} />
            </dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
