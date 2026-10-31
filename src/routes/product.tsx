import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Sparkles } from "lucide-react";

import { BrowserFrame, PhoneFrame } from "@/components/marketing/frames";
import { CtaBand } from "@/components/marketing/CtaBand";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { PRODUCT_SECTIONS } from "@/config/marketing";
import { seoHead } from "@/config/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product")({
  head: () =>
    seoHead({
      title: "Product — ERPX",
      description:
        "Explore ERPX modules for accounting, sales and billing, inventory, CRM and HRMS. See what is available today and what is on the roadmap.",
      path: "/product",
    }),
  component: ProductPage,
});

function ProductPage() {
  return (
    <MarketingLayout>
      <Section className="pt-16 sm:pt-20 lg:pt-24">
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Product
              </Eyebrow>
            </Reveal>
            <Reveal>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.75rem]">
                One platform for the work that <span className="m-accent">runs the business</span>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
                ERPX connects the modules your team uses every day to the same records, permissions
                and audit trail. Start with what you need and grow into the rest.
              </p>
            </Reveal>
            <Reveal>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/auth" className="m-btn-primary w-full sm:w-auto">
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/demo" className="m-btn-secondary w-full sm:w-auto">
                  Book a demo
                </Link>
              </div>
            </Reveal>
            <Reveal>
              <p className="mt-6 inline-flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-100/75">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Capabilities labelled “Coming soon” are on the roadmap and are not available yet.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {PRODUCT_SECTIONS.map((section, index) => {
        const reversed = index % 2 === 1;
        return (
          <section
            key={section.id}
            id={section.id}
            className={cn(
              "scroll-mt-24 border-t border-white/[0.07] py-16 sm:py-20 lg:py-24",
              reversed && "bg-white/[0.015]",
            )}
          >
            <Container>
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div className={cn(reversed && "lg:order-2")}>
                  <Reveal>
                    <Eyebrow>{section.eyebrow}</Eyebrow>
                  </Reveal>
                  <Reveal>
                    <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-white sm:text-4xl">
                      {section.title}
                    </h2>
                  </Reveal>
                  <Reveal>
                    <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
                      {section.description}
                    </p>
                  </Reveal>

                  <Reveal>
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-sm text-white/70">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-sky-300"
                            aria-hidden="true"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  {section.comingSoon.length > 0 ? (
                    <Reveal>
                      <div className="mt-7 space-y-3">
                        {section.comingSoon.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4"
                          >
                            <p className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                              <Clock className="h-4 w-4" aria-hidden="true" />
                              {item.label}
                              <span className="rounded-full border border-amber-300/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                                Coming soon
                              </span>
                            </p>
                            <p className="mt-1.5 text-xs leading-relaxed text-amber-100/60">
                              {item.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Reveal>
                  ) : null}
                </div>

                <Reveal className={cn(reversed && "lg:order-1")}>
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.18),transparent_68%)] blur-2xl"
                    />
                    {section.visual.kind === "browser" ? (
                      <BrowserFrame
                        src={section.visual.src}
                        alt={section.visual.alt}
                        url={section.visual.url}
                        className="relative"
                      />
                    ) : (
                      <PhoneFrame className="relative mx-auto">
                        <img
                          src={section.visual.src}
                          alt={section.visual.alt}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </PhoneFrame>
                    )}
                  </div>
                </Reveal>
              </div>
            </Container>
          </section>
        );
      })}

      <Section>
        <Container>
          <SectionHeading
            eyebrow={<Eyebrow>One workspace</Eyebrow>}
            title="Modules that share the same records"
            description="An invoice writes to accounting. A stock movement updates inventory. A payment updates receivables. No exports, no reconciliation between tools."
          />
        </Container>
      </Section>

      <CtaBand
        title="See ERPX with your own workflows"
        description="Bring a process you want to fix. We will walk through it on a live workspace."
      />
    </MarketingLayout>
  );
}
