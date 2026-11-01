import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { CtaBand } from "@/components/marketing/CtaBand";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Container, Eyebrow, Reveal, Section } from "@/components/marketing/primitives";
import { SOLUTIONS } from "@/config/solutions";
import { absoluteUrl, breadcrumbJsonLd, seoHead } from "@/config/site";

export const Route = createFileRoute("/solutions/")({
  head: () =>
    seoHead({
      title: "ERP Software Solutions — Accounting, Billing, Inventory | ERPX",
      description:
        "Explore ERPX solutions: accounting software, GST billing, inventory management, CRM and HRMS & payroll — all sharing one set of records.",
      path: "/solutions",
      jsonLd: [
        breadcrumbJsonLd("Solutions", "/solutions"),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: SOLUTIONS.map((solution, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: solution.eyebrow,
            url: absoluteUrl(`/solutions/${solution.slug}`),
          })),
        },
      ],
    }),
  component: SolutionsIndexPage,
});

function SolutionsIndexPage() {
  return (
    <MarketingLayout>
      <Section className="pt-16 sm:pt-20 lg:pt-24">
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Solutions
              </Eyebrow>
            </Reveal>
            <Reveal>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.75rem]">
                ERP software for every part of <span className="m-accent">your business</span>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
                Each ERPX solution works on its own and gets stronger together: an invoice updates
                your accounts, a sale consumes stock, and every entry lands in the same audit trail.
              </p>
            </Reveal>
          </div>

          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((solution) => (
              <li key={solution.slug}>
                <Reveal className="h-full">
                  <Link
                    to="/solutions/$slug"
                    params={{ slug: solution.slug }}
                    className="m-card group flex h-full flex-col rounded-2xl p-6 transition-colors"
                  >
                    <solution.icon className="h-6 w-6 text-sky-300" aria-hidden="true" />
                    <h2 className="mt-4 text-lg font-semibold text-white">{solution.eyebrow}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">
                      {solution.metaDescription}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300">
                      Learn more
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand />
    </MarketingLayout>
  );
}
