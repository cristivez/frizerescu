import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
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

/**
 * Extra DOM attributes a caller may pass through — onClick (e.g. booking-click
 * tracking), aria-label, id, title, data-*, etc. `href` is Button's own
 * controlled prop, so it's excluded here. `type` and `disabled` are also
 * excluded: AnchorHTMLAttributes and ButtonHTMLAttributes disagree on what
 * `type` means (MIME-type hint on <a> vs submit/reset/button on <button>),
 * and `disabled` isn't a valid <a> attribute at all — both are declared as
 * explicit props below instead and are only ever applied to the native
 * <button> branch, never spread onto an anchor.
 */
type ExtraProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>,
  "href" | "type" | "disabled"
>;

export function Button({
  children,
  href,
  external = false,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  external?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Native <button> only. Defaults to "button" so a Button nested in a
   * future <form> never accidentally submits it. */
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  /** Native <button> only — not a valid <a> attribute, so it's never spread
   * onto the link-flavored branches. */
  disabled?: boolean;
} & ExtraProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-none",
    "font-medium transition-colors duration-200 ease-[var(--ease-out)]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  // tel: must be a plain anchor, and this check must come before `external`:
  // a tel: link opened with target="_blank" leaves a dead blank tab behind on
  // desktop (the OS hands off to the dialer app; there is nothing to render
  // in the new tab). This branch comes first so a caller cannot get it wrong
  // by passing `external`.
  if (href?.startsWith("tel:")) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
