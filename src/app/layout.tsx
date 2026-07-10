import type { ReactNode } from "react";

// The locale layout owns <html>/<body>; this root layout exists only because
// Next requires one above a dynamic [locale] segment.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
