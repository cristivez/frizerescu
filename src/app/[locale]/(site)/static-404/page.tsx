import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import NotFound from "../../not-found";

// Build-time source for the 404 page the Worker serves itself. Prerendered once per
// locale; scripts/build-static-404.mjs copies the HTML (minus scripts) into the
// Worker bundle, so an unknown address gets the styled 404 without booting Next.
// Never reached in production: worker/page-routes.ts does not list this path, so a
// request for it is answered with that same 404.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function Static404({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotFound />;
}
