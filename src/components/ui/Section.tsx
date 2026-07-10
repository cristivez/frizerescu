import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  children,
  id,
  muted = false,
  className,
}: {
  children: ReactNode;
  id?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("py-section", muted && "bg-surface-muted", className)}
    >
      {children}
    </section>
  );
}
