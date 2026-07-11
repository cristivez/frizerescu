import { Plus } from "lucide-react";
import { faq } from "@/data/faq";
import type { Locale } from "@/i18n/routing";

/**
 * FAQ accordion built on native <details>/<summary>: no JavaScript, the answers
 * ship in the server HTML (so they are crawlable and match the FAQPage schema),
 * the summary is keyboard-operable and gets the global :focus-visible ring for
 * free, and the open/close is instant under reduced motion (globals.css zeroes
 * transition-duration there). The plus mark rotates to an ✕ when a row is open.
 */
export function Faq({ locale }: { locale: Locale }) {
  return (
    <ul className="mt-16 border-t border-line">
      {faq.map((item) => (
        <li key={item.id}>
          <details className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="text-body-lg font-medium text-ink transition-colors duration-200 group-hover:text-accent-strong group-open:text-accent-strong">
                {item.question[locale]}
              </span>
              <Plus
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-ink-secondary transition-transform duration-300 group-open:rotate-45 group-open:text-accent"
              />
            </summary>
            <p className="max-w-[68ch] pb-6 text-ink-secondary">{item.answer[locale]}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
