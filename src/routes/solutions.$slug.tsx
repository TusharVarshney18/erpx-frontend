import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronRight, Clock, Link2 } from "lucide-react";

import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { BrowserFrame, PhoneFrame } from "@/components/marketing/frames";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { SOLUTIONS, getSolution, type Solution } from "@/config/solutions";
import { absoluteUrl, faqJsonLd, seoHead, softwareApplicationJsonLd } from "@/config/site";

export const Route = createFileRoute("/solutions/$slug")({
  loader: ({ params }) => {
    const solution = getSolution(params.slug);
    if (!solution) throw notFound();
    return { slug: solution.slug };
  },
  head: ({ params }) => {
    const solution = getSolution(params.slug);
    if (!solution) return {};
    const path = `/solutions/${solution.slug}`;
    return seoHead({
      title: solution.metaTitle,
      description: solution.metaDescription,
      path,
      jsonLd: [
        softwareApplicationJsonLd(),
        faqJsonLd(solution.faqs),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Solutions", item: absoluteUrl("/solutions") },
            { "@type": "ListItem", position: 3, name: solution.name, item: absoluteUrl(path) },
          ],
        },
      ],
    });
  },
  component: SolutionPage,
});

function SolutionPage() {
  const { slug } = Route.useLoaderData();
  const solution = getSolution(slug) as Solution;
  const related = SOLUTIONS.filter((item) => item.slug !== solution.slug);

  return (
    <MarketingLayout>
      <Section className="pt-10 sm:pt-14 lg:pt-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-8 text-xs text-white/45">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <li>
                <Link to="/solutions" className="hover:text-white">
                  Solutions
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <li aria-current="page" className="text-white/70">
                {solution.name}
              </li>
            </ol>
          </nav>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <Eyebrow>
                  <solution.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {solution.eyebrow}
                </Eyebrow>
              </Reveal>
              <Reveal>
                <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl">
                  {solution.headline}
                </h1>
              </Reveal>
              {solution.intro.map((paragraph) => (
                <Reveal key={paragraph}>
                  <p className="mt-5 text-base leading-relaxed text-white/65 sm:text-lg">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
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
            </div>

            <Reveal>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.18),transparent_68%)] blur-2xl"
                />
                {solution.visual.kind === "browser" ? (
                  <BrowserFrame
                    src={solution.visual.src}
                    alt={solution.visual.alt}
                    url={solution.visual.url}
                    className="relative"
                    priority
                  />
                ) : (
                  <PhoneFrame className="relative mx-auto">
                    <img
                      src={solution.visual.src}
                      alt={solution.visual.alt}
                      fetchPriority="high"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </PhoneFrame>
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <section className="border-t border-white/[0.07] py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow={<Eyebrow>Capabilities</Eyebrow>}
            title={`What you can do with ERPX ${solution.name}`}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {solution.capabilities.map((capability) => (
              <Reveal key={capability.title}>
                <article className="m-card h-full rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {capability.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {capability.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-white/70">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          {solution.comingSoon.length > 0 ? (
            <div className="mt-6 space-y-3">
              {solution.comingSoon.map((item) => (
                <Reveal key={item.label}>
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-amber-100">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                      <span className="rounded-full border border-amber-300/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                        Coming soon
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-100/60">{item.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      <section className="border-t border-white/[0.07] bg-white/[0.015] py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow={<Eyebrow>Who it is for</Eyebrow>}
                title="Built for teams like yours"
              />
              <ul className="mt-8 space-y-5">
                {solution.audience.map((item) => (
                  <Reveal key={item.title}>
                    <li>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{item.description}</p>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading
                align="left"
                eyebrow={<Eyebrow>Connected</Eyebrow>}
                title="Shares records with the rest of ERPX"
              />
              <ul className="mt-8 space-y-5">
                {solution.connections.map((item) => (
                  <Reveal key={item.title}>
                    <li className="flex gap-3">
                      <Link2 className="mt-1 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                      <div>
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow={<Eyebrow>FAQ</Eyebrow>}
            title={`${solution.name} questions, answered`}
          />
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <FaqList faqs={solution.faqs} />
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Explore other solutions
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/solutions/$slug"
                  params={{ slug: item.slug }}
                  className="m-card flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <item.icon className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  {item.eyebrow}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand
        title={`Try ERPX ${solution.name} on your own data`}
        description="Start free in minutes, or book a walkthrough with our team."
      />
    </MarketingLayout>
  );
}
