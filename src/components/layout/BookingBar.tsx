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
    // The outer layer owns the safe-area insets (bottom: the iPhone home
    // indicator once the browser bar collapses; left/right: landscape notch)
    // on a solid background, so the buttons never sit under the home
    // indicator and the inset strip reads as intentional chrome. The inner
    // grid keeps the hairline gap between the two buttons.
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:hidden">
      <div className="grid grid-cols-2 gap-px bg-line">
        <Button href={meroUrl} external variant="primary" className="rounded-none">
          {t("book")}
        </Button>
        <Button href={`tel:${phone}`} variant="secondary" className="rounded-none bg-bg">
          {t("call")}
        </Button>
      </div>
    </div>
  );
}
