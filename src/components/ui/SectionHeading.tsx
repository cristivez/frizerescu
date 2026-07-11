import { cn } from "@/lib/cn";

export function SectionHeading({
  overline,
  title,
  lead,
  className,
}: {
  overline?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[68ch]", className)}>
      {overline && (
        <p className="mb-4 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink-secondary">
          {overline}
        </p>
      )}
      {/* Bodoni, display-only. Negative tracking on large Didone display only. */}
      <h2 className="font-display text-h2 tracking-[-0.015em] text-ink">{title}</h2>
      {lead && <p className="mt-6 text-body-lg text-ink-secondary">{lead}</p>}
    </div>
  );
}
