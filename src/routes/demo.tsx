import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CheckCircle2, Clock, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CtaBand } from "@/components/marketing/CtaBand";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/primitives";
import { TEAM_SIZES } from "@/config/marketing";
import { seoHead } from "@/config/site";
import { submitDemoRequest } from "@/lib/api/demo.functions";
import { demoFormSchema, type DemoFormValues } from "@/lib/demo-schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () =>
    seoHead({
      title: "Book a demo — ERPX",
      description:
        "See ERPX on your own workflows. Book a 30-minute walkthrough of accounting, sales, inventory, CRM and HR with our team.",
      path: "/demo",
    }),
  component: DemoPage,
});

const EXPECTATIONS = [
  "A 30-minute walkthrough, not a slide deck",
  "Bring one workflow you want to fix",
  "Straight answers on migration, roles and pricing",
  "No obligation to buy",
];

const NEXT_STEPS = [
  { title: "We reply", description: "Within one business day, from a real person." },
  { title: "We prepare", description: "A workspace shaped around your workflow." },
  { title: "We walk through it", description: "Questions welcome — including the awkward ones." },
];

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-sky-300/50 focus:bg-white/[0.06]";
const labelClass = "block text-[13px] font-medium text-white/75";

function DemoPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: "",
      workEmail: "",
      company: "",
      teamSize: "",
      message: "",
      website: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await submitDemoRequest({ data: values });
      const first = values.name.trim().split(/\s+/)[0];
      setFirstName(first || values.name.trim());
      reset();
    } catch {
      setSubmitError(
        "We couldn't send your request just now. Please try again in a moment.",
      );
    }
  });

  return (
    <MarketingLayout>
      <Section className="pt-16 sm:pt-20 lg:pt-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <Reveal>
                <Eyebrow>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Book a demo
                </Eyebrow>
              </Reveal>
              <Reveal>
                <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl">
                  Let's map ERPX to how you <span className="m-accent">actually work</span>
                </h1>
              </Reveal>
              <Reveal>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                  Tell us a little about your team. We'll set up a short, working session around
                  the process you want to improve — no generic deck.
                </p>
              </Reveal>

              <Reveal>
                <ul className="mt-7 space-y-3">
                  {EXPECTATIONS.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal>
                <div className="mt-10">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    What happens next
                  </h2>
                  <ol className="mt-4 space-y-4 border-l border-white/10 pl-5">
                    {NEXT_STEPS.map((step) => (
                      <li key={step.title} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-[1.55rem] top-1.5 h-2 w-2 rounded-full bg-sky-300"
                        />
                        <p className="text-sm font-medium text-white">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                          {step.description}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>

              <Reveal>
                <p className="mt-8 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/40">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Prefer to explore on your own?
                  <Link
                    to="/auth"
                    className="font-medium text-sky-300 transition-colors hover:text-sky-200"
                  >
                    Start free instead
                  </Link>
                </p>
              </Reveal>
            </div>

            <Reveal>
              <div className="m-card rounded-2xl p-6 sm:p-8">
                {firstName ? (
                  <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                      Thanks, {firstName}.
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                      Your demo request is in. We'll reply within one business day to find a time
                      that works.
                    </p>
                    <button
                      type="button"
                      className="m-btn-secondary mt-6"
                      onClick={() => setFirstName(null)}
                    >
                      Book another demo
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-white">
                        Tell us about your team
                      </h2>
                      <p className="mt-1 text-sm text-white/50">
                        All fields except the message are required.
                      </p>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                      <div>
                        <label htmlFor="name" className={labelClass}>
                          Full name
                        </label>
                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Jane Doe"
                          className={cn(fieldClass, errors.name && "border-rose-400/60")}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "name-error" : undefined}
                          {...register("name")}
                        />
                        {errors.name ? (
                          <p id="name-error" role="alert" className="mt-1.5 text-xs text-rose-300">
                            {errors.name.message}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label htmlFor="workEmail" className={labelClass}>
                          Work email
                        </label>
                        <input
                          id="workEmail"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className={cn(fieldClass, errors.workEmail && "border-rose-400/60")}
                          aria-invalid={Boolean(errors.workEmail)}
                          aria-describedby={errors.workEmail ? "workEmail-error" : undefined}
                          {...register("workEmail")}
                        />
                        {errors.workEmail ? (
                          <p
                            id="workEmail-error"
                            role="alert"
                            className="mt-1.5 text-xs text-rose-300"
                          >
                            {errors.workEmail.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="company" className={labelClass}>
                            Company
                          </label>
                          <input
                            id="company"
                            type="text"
                            autoComplete="organization"
                            placeholder="Acme Inc."
                            className={cn(fieldClass, errors.company && "border-rose-400/60")}
                            aria-invalid={Boolean(errors.company)}
                            aria-describedby={errors.company ? "company-error" : undefined}
                            {...register("company")}
                          />
                          {errors.company ? (
                            <p
                              id="company-error"
                              role="alert"
                              className="mt-1.5 text-xs text-rose-300"
                            >
                              {errors.company.message}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label htmlFor="teamSize" className={labelClass}>
                            Team size
                          </label>
                          <select
                            id="teamSize"
                            className={cn(
                              fieldClass,
                              "appearance-none [&>option]:bg-[#0b1426] [&>option]:text-white",
                              errors.teamSize && "border-rose-400/60",
                            )}
                            aria-invalid={Boolean(errors.teamSize)}
                            aria-describedby={errors.teamSize ? "teamSize-error" : undefined}
                            {...register("teamSize")}
                          >
                            <option value="">Select…</option>
                            {TEAM_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size} people
                              </option>
                            ))}
                          </select>
                          {errors.teamSize ? (
                            <p
                              id="teamSize-error"
                              role="alert"
                              className="mt-1.5 text-xs text-rose-300"
                            >
                              {errors.teamSize.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className={labelClass}>
                          What would you like to see?{" "}
                          <span className="font-normal text-white/35">(optional)</span>
                        </label>
                        <textarea
                          id="message"
                          rows={4}
                          placeholder="e.g. We invoice across three GST states and reconcile payments manually."
                          className={cn(fieldClass, "resize-y", errors.message && "border-rose-400/60")}
                          aria-invalid={Boolean(errors.message)}
                          aria-describedby={errors.message ? "message-error" : undefined}
                          {...register("message")}
                        />
                        {errors.message ? (
                          <p
                            id="message-error"
                            role="alert"
                            className="mt-1.5 text-xs text-rose-300"
                          >
                            {errors.message.message}
                          </p>
                        ) : null}
                      </div>

                      {/* Honeypot — hidden from people, tempting to bots. */}
                      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          {...register("website")}
                        />
                      </div>

                      {submitError ? (
                        <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                          {submitError}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="m-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Sending…
                          </>
                        ) : (
                          <>
                            Request a demo
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] leading-relaxed text-white/35">
                        We'll only use these details to arrange your demo. No newsletters without
                        your consent.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Want to try it first?"
        description="Create a free workspace now and explore the modules at your own pace."
      />
    </MarketingLayout>
  );
}
