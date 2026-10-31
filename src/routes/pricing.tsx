import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import { Fragment, useState } from "react";

import { CtaBand } from "@/components/marketing/CtaBand";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  COMPARISON_GROUPS,
  GST_NOTE,
  PLANS,
  PRICING_FAQS,
  YEARLY_SAVING_PERCENT,
  formatInr,
  planSelectionValue,
  type PricingPlan,
} from "@/config/plans";
import { seoHead } from "@/config/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seoHead({
      title: "Pricing — ERPX",
      description:
        "Simple INR pricing for ERPX. Compare Free, Starter, Pro and Enterprise plans, billed monthly or yearly. Prices exclude GST.",
      path: "/pricing",
    }),
  component: PricingPage,
});

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <MarketingLayout>
      <Section className="pt-16 sm:pt-20 lg:pt-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Pricing
              </Eyebrow>
            </Reveal>
            <Reveal>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.75rem]">
                Pricing that scales with <span className="m-accent">your team</span>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
                Start free. Upgrade when your team and workflows grow. Every plan includes the core
                modules, GST-ready invoicing and a full audit trail.
              </p>
            </Reveal>

            <Reveal>
              <div className="mt-8 flex flex-col items-center gap-3">
                <div
                  role="group"
                  aria-label="Billing period"
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1"
                >
                  <button
                    type="button"
                    aria-pressed={!yearly}
                    onClick={() => setYearly(false)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      !yearly
                        ? "bg-white text-[#0b1426] shadow-sm"
                        : "text-white/65 hover:text-white",
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    aria-pressed={yearly}
                    onClick={() => setYearly(true)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      yearly
                        ? "bg-white text-[#0b1426] shadow-sm"
                        : "text-white/65 hover:text-white",
                    )}
                  >
                    Yearly
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        yearly ? "bg-emerald-600/15 text-emerald-700" : "bg-emerald-400/15 text-emerald-300",
                      )}
                    >
                      Save {YEARLY_SAVING_PERCENT}%
                    </span>
                  </button>
                </div>
                <p className="text-xs text-white/40">{GST_NOTE}</p>
              </div>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <Reveal key={plan.id}>
                <PlanCard plan={plan} yearly={yearly} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <ComparisonTable yearly={yearly} />

      <Section className="border-t border-white/[0.07]">
        <Container>
          <SectionHeading
            eyebrow={<Eyebrow>FAQ</Eyebrow>}
            title="Questions, answered"
            description="Still unsure? Book a demo and we'll go through your specific setup."
          />
          <Reveal>
            <div className="mx-auto mt-10 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {PRICING_FAQS.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${index}`}
                    className="border-white/10"
                  >
                    <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-white hover:no-underline [&>svg]:text-white/40">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-relaxed text-white/60">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title="Not sure which plan fits?"
        description="Tell us how your team works today and we'll recommend a starting point."
      />
    </MarketingLayout>
  );
}

function PlanCard({ plan, yearly }: { plan: PricingPlan; yearly: boolean }) {
  const price = yearly ? plan.yearlyInr : plan.monthlyInr;
  const isCustom = price === null;

  return (
    <article
      className={cn(
        "m-card relative flex h-full flex-col rounded-2xl p-6",
        plan.popular && "border-sky-300/35 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]",
      )}
    >
      {plan.popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-sky-300/30 bg-[#0b1a30] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200">
          Most popular
        </span>
      ) : null}

      <h2 className="text-lg font-semibold tracking-tight text-white">{plan.name}</h2>
      <p className="mt-1.5 min-h-10 text-[13px] leading-relaxed text-white/50">{plan.tagline}</p>

      <div className="mt-5">
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-white">
            {isCustom ? "Custom" : formatInr(price)}
          </span>
          {!isCustom && plan.id !== "free" ? (
            <span className="pb-1 text-xs text-white/45">/ month</span>
          ) : null}
        </div>
        <p className="mt-1.5 min-h-4 text-[11px] text-white/40">
          {plan.id === "free"
            ? "Free forever"
            : isCustom
              ? "Annual agreement"
              : yearly
                ? `Billed ${formatInr((price as number) * 12)} / year`
                : "Billed monthly"}
        </p>
      </div>

      {plan.id === "enterprise" ? (
        <Link to="/demo" className={cn("mt-5 w-full", plan.popular ? "m-btn-primary" : "m-btn-secondary")}>
          {plan.cta}
        </Link>
      ) : (
        <Link
          to="/auth"
          search={{ plan: planSelectionValue(plan, yearly) }}
          className={cn("mt-5 w-full", plan.popular ? "m-btn-primary" : "m-btn-secondary")}
        >
          {plan.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <ul className="mt-6 space-y-2.5 border-t border-white/[0.07] pt-5 text-[13px] text-white/65">
        {plan.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
            {highlight}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ComparisonTable({ yearly }: { yearly: boolean }) {
  return (
    <Section className="border-t border-white/[0.07] bg-white/[0.015]">
      <Container>
        <SectionHeading
          eyebrow={<Eyebrow>Compare plans</Eyebrow>}
          title="What's included"
          description="A side-by-side view of limits, modules and support."
        />

        <Reveal>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <caption className="sr-only">
                ERPX plan comparison. Prices {yearly ? "billed yearly" : "billed monthly"}, excluding
                GST.
              </caption>
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th scope="col" className="px-4 py-4 text-left font-medium text-white/55">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={cn(
                        "px-4 py-4 text-left font-semibold text-white",
                        plan.popular && "bg-sky-300/[0.06]",
                      )}
                    >
                      <span className="block">{plan.name}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-white/40">
                        {plan.id === "enterprise"
                          ? "Custom"
                          : `${formatInr(yearly ? plan.yearlyInr : plan.monthlyInr)}${
                              plan.id === "free" ? "" : " / mo"
                            }`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_GROUPS.map((group) => (
                  <Fragment key={group.title}>
                    <tr className="bg-white/[0.02]">
                      <th
                        scope="colgroup"
                        colSpan={5}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/70"
                      >
                        {group.title}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-t border-white/[0.06]">
                        <th scope="row" className="px-4 py-3.5 text-left font-normal text-white/70">
                          {row.label}
                          {row.hint ? (
                            <span className="mt-0.5 block text-[11px] text-white/40">
                              {row.hint}
                            </span>
                          ) : null}
                        </th>
                        {PLANS.map((plan) => {
                          const value = row.values[plan.id];
                          return (
                            <td
                              key={plan.id}
                              className={cn(
                                "px-4 py-3.5 align-top text-white/70",
                                plan.popular && "bg-sky-300/[0.04]",
                              )}
                            >
                              {typeof value === "boolean" ? (
                                value ? (
                                  <>
                                    <Check
                                      className="h-4 w-4 text-sky-300"
                                      aria-hidden="true"
                                    />
                                    <span className="sr-only">Included</span>
                                  </>
                                ) : (
                                  <>
                                    <Minus
                                      className="h-4 w-4 text-white/25"
                                      aria-hidden="true"
                                    />
                                    <span className="sr-only">Not included</span>
                                  </>
                                )
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <p className="mt-4 text-xs text-white/40">{GST_NOTE}</p>
      </Container>
    </Section>
  );
}
