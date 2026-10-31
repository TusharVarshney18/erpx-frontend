import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Container, Reveal, Section } from "./primitives";

export function CtaBand({
  title = "Ready to run your business on one platform?",
  description = "Start free in minutes, or talk to our team about your workflows and migration.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Section className="pt-0">
      <Container>
        <Reveal>
          <div className="m-card relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-400/20 blur-[90px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-[100px]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
                {description}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/auth" className="m-btn-primary w-full sm:w-auto">
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/demo" className="m-btn-secondary w-full sm:w-auto">
                  Book a demo
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/40">
                No credit card required · GST-ready from day one
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
