import { notFound } from "next/navigation";

// Catch-all for unknown paths under a locale: triggers the localized
// not-found boundary instead of Next's default unstyled 404.
export default function CatchAll() {
  notFound();
}
