import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  History,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { CtaBand } from "@/components/marketing/CtaBand";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PhoneShowcase } from "@/components/marketing/PhoneShowcase";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
  SectionHeading,
} from "@/components/marketing/primitives";
import { MODULES, STEPS, TRUST_POINTS } from "@/config/marketing";
import { seoHead } from "@/config/site";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: "ERPX — Run your entire business on one platform",
      description:
        "Accounting, sales, inventory, CRM and HR in one GST-ready workspace with role-based access, per-company isolation and an audit trail on every entry.",
      path: "/",
    }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Signed-in visitors skip the marketing page and land in their workspace.
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <MarketingLayout>
      <Hero />
      <TrustStrip />
      <Modules />
      <MobileSection />
      <HowItWorks />
      <CtaBand />
    </MarketingLayout>
  );
}

function Hero() {
  return (
    <Section className="overflow-hidden pt-14 sm:pt-20 lg:pt-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              One operating system for your business
            </Eyebrow>
          </Reveal>

          <Reveal>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.4rem]">
              Run your entire business on <span className="m-accent">one platform</span>
            </h1>
          </Reveal>

          <Reveal>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Accounting, sales, inventory, CRM and HR in one connected workspace — GST-ready,
              role-aware, and built for teams that have outgrown spreadsheets.
            </p>
          </Reveal>

          <Reveal>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth" className="m-btn-primary w-full sm:w-auto">
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/demo" className="m-btn-secondary w-full sm:w-auto">
                Book demo
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                Free to start
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                No credit card required
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                GST-ready from day one
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-14 sm:mt-20">
          <div className="relative mx-auto max-w-5xl">
            <div
              aria-hidden="true"
              className="m-hero-glow pointer-events-none absolute -inset-x-6 -top-6 bottom-8 rounded-[3rem]"
            />
            <BrowserFrame
              src="/mockups/dashboard-overview.png"
              alt="ERPX dashboard showing sales, cash position and recent activity"
              url="app.erpx.com/dashboard"
              priority
              className="relative"
            />

            <div className="pointer-events-none absolute -left-8 top-24 hidden w-52 xl:block">
              <div className="m-card m-float flex items-center gap-3 rounded-2xl p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
                  <ReceiptText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                    Billing
                  </p>
                  <p className="text-sm font-medium text-white">GST-ready invoices</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-6 top-1/2 hidden w-56 -translate-y-1/2 xl:block">
              <div
                className="m-card m-float flex items-center gap-3 rounded-2xl p-4"
                style={{ animationDelay: "1.6s" }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-400/15 text-sky-300">
                  <History className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                    Governance
                  </p>
                  <p className="text-sm font-medium text-white">Audit trail on every entry</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-white/[0.07] bg-white/[0.02]">
      <Container>
        <ul className="grid gap-x-8 gap-y-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300">
                <point.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{point.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{point.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Modules() {
  return (
    <Section id="modules">
      <Container>
        <SectionHeading
          eyebrow={<Eyebrow>Every core function</Eyebrow>}
          title="Five modules. One source of truth."
          description="Stop stitching tools together. Each module writes to the same records, so finance, sales and operations always see the same numbers."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <Reveal key={module.id}>
              <article className="m-card m-card-hover flex h-full flex-col rounded-2xl p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-sky-400/10 text-sky-300">
                  <module.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">
                  {module.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{module.summary}</p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-white/45">
                  {module.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300/80" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Link
                  to="/product"
                  hash={module.id}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
                >
                  Explore {module.name}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}

          <Reveal>
            <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-6">
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">
                  Built for trust
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Every module shares the same role-based permissions, company isolation and audit
                  trail — not bolted on afterwards.
                </p>
              </div>
              <Link
                to="/product"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
              >
                See how it fits together
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function MobileSection() {
  return (
    <Section id="mobile" className="border-y border-white/[0.07] bg-white/[0.015]">
      <Container>
        <PhoneShowcase
          eyebrow={
            <Eyebrow>
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              Mobile
            </Eyebrow>
          }
          title="Your business in your pocket"
          description="See today's numbers, check in from the floor and approve leave — the mobile workspace stays in sync with the web app, same records and permissions."
        />
      </Container>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Container>
        <SectionHeading
          eyebrow={<Eyebrow>How it works</Eyebrow>}
          title="Live in an afternoon, not a quarter"
          description="No long implementation project. Start with the modules you need and add the rest as your team grows."
        />

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number}>
              <Reveal>
                <div className="m-card h-full rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-[0.2em] text-sky-300/80">
                      {step.number}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-sky-300">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{step.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
