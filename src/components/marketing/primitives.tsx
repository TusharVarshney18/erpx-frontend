import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
}

/** Scroll-reveal wrapper (progressive enhancement, see marketing.css). */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("m-reveal", className)}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="m-eyebrow">{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? <Reveal>{eyebrow}</Reveal> : null}
      <Reveal>
        <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-white sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal>
          <p
            className={cn(
              "mt-4 text-base leading-relaxed text-white/60 sm:text-lg",
              align === "center" && "mx-auto max-w-2xl",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

export function GradientOrb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full blur-[110px] opacity-60",
        className,
      )}
    />
  );
}
