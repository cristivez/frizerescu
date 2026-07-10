import { useTranslations } from "next-intl";
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
  const { reviews, rating, locations } = verifiedTotals();
  const nf = new Intl.NumberFormat("ro-RO");

  const items = [
    { value: reviews, format: (n: number) => nf.format(Math.round(n)), label: t("reviews") },
    { value: rating, format: (n: number) => n.toFixed(2).replace(".", ","), label: t("rating") },
    { value: locations, format: (n: number) => String(Math.round(n)), label: t("locations") },
  ];

  return (
    <Container>
      <dl className="grid grid-cols-1 gap-10 border-y border-line py-compact sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <dd className="font-display text-h1 tracking-[-0.015em] text-ink">
              <CountUp value={item.value} format={item.format} />
            </dd>
            <dt className="mt-2 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    </Container>
  );
}
