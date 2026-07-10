import { useTranslations } from "next-intl";
import { RazorWipe } from "@/components/motion/RazorWipe";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";

// TEMPORARY: this placeholder homepage exists only so the Task 6
// reduced-motion e2e test has real [data-razor-wipe] / [data-countup] /
// [data-reveal] elements to assert against. Task 9 replaces this file with
// the real homepage. The CountUp value (42) is an arbitrary placeholder, not
// a location review count.
export default function Home() {
  const t = useTranslations("nav");
  return (
    <>
      <RazorWipe>
        <h1>{t("home")}</h1>
      </RazorWipe>
      <Reveal>
        <p>{t("services")}</p>
      </Reveal>
      <CountUp value={42} />
    </>
  );
}
