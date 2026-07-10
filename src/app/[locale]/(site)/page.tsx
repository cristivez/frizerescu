import { useTranslations } from "next-intl";
import { RazorWipe } from "@/components/motion/RazorWipe";
import { CountUp } from "@/components/motion/CountUp";

// TEMPORARY: this placeholder homepage exists only so the Task 6
// reduced-motion e2e test has real [data-razor-wipe] / [data-countup]
// elements to assert against. Task 9 replaces this file with the real
// homepage. The CountUp value (42) is an arbitrary placeholder, not a
// location review count.
export default function Home() {
  const t = useTranslations("nav");
  return (
    <>
      <RazorWipe>
        <h1>{t("home")}</h1>
      </RazorWipe>
      <CountUp value={42} />
    </>
  );
}
