import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Brass fill. The only large saturated fill on the site.
  primary: "bg-accent text-ink-on-accent hover:bg-accent-strong",
  // Ghost that inverts on hover.
  secondary:
    "border border-line-strong text-ink hover:bg-ink hover:text-bg hover:border-ink",
  outline: "border border-line text-ink-secondary hover:text-ink hover:border-line-strong",
};

const SIZES: Record<Size, string> = {
  // min-h-11 == 44px: WCAG 2.5.5 / design system §9.
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-11 px-6 text-base",
  lg: "min-h-12 px-8 text-base",
};

export function Button({
  children,
  href,
  external = false,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  external?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-none",
    "font-medium transition-colors duration-200 ease-[var(--ease-out)]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  // tel: must be a plain anchor. It is not `external` — opening a dialer in a
  // new tab leaves a dead blank tab behind on desktop. This branch comes first
  // so a caller cannot get it wrong by passing `external`.
  if (href?.startsWith("tel:")) {
    return <a href={href} className={classes}>{children}</a>;
  }
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...rest}>{children}</button>;
}
