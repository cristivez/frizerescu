"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function BookingBar({ meroUrl, phone }: { meroUrl: string; phone: string }) {
  const t = useTranslations("cta");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-line bg-line md:hidden">
      <Button href={meroUrl} external variant="primary" className="rounded-none">
        {t("book")}
      </Button>
      <Button href={`tel:${phone}`} variant="secondary" className="rounded-none bg-bg">
        {t("call")}
      </Button>
    </div>
  );
}
