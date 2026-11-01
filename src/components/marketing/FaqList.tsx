import { ChevronDown } from "lucide-react";

/**
 * FAQ list built on native <details>/<summary>.
 *
 * Unlike a JS accordion, collapsed answers stay in the server-rendered HTML, so
 * search engines can read them (they must match the FAQPage structured data).
 */
export function FaqList({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <div className="w-full">
      {faqs.map((faq) => (
        <details key={faq.question} className="group border-b border-white/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown
              className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-white/60">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
