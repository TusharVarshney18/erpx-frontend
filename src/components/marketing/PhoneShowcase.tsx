import { useEffect, useRef, useState, type ReactNode } from "react";

import { MOBILE_APP_DEMO, MOBILE_TABS } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./frames";

export function PhoneShowcase({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = MOBILE_TABS[active];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const selectTab = (index: number) => {
    setActive(index);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = MOBILE_TABS[index].start;
    void video.play().catch(() => {});
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = MOBILE_TABS.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const time = video.currentTime;
    let next = 0;
    for (let index = 0; index < MOBILE_TABS.length; index += 1) {
      if (time >= MOBILE_TABS[index].start) next = index;
    }
    if (next !== active) setActive(next);
  };

  return (
    <div ref={containerRef} className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
      <div>
        {eyebrow ? <div className="m-reveal">{eyebrow}</div> : null}
        {title ? (
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-white sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            {description}
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label="Mobile app screens"
          aria-orientation="horizontal"
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-lg"
        >
          {MOBILE_TABS.map((tab, index) => {
            const selected = index === active;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`mobile-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls="mobile-preview-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-sky-300/40 bg-sky-300/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id="mobile-preview-panel"
          role="tabpanel"
          aria-labelledby={`mobile-tab-${current.id}`}
          className="mt-6 min-h-12 max-w-lg"
        >
          <p className="text-sm leading-relaxed text-white/60" aria-live="polite">
            {current.caption}
          </p>
        </div>

        <ul className="mt-6 space-y-2.5 text-sm text-white/55">
          <li>· Stays in sync with the web workspace in real time</li>
          <li>· Approvals and records use the same roles and permissions</li>
          <li>· Built for the floor, the counter and the field</li>
        </ul>
      </div>

      <div className="relative mx-auto w-[19rem] max-w-full">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.28),transparent_65%)] blur-2xl"
        />
        <PhoneFrame className="relative mx-auto">
          {reduceMotion ? (
            <img
              src={MOBILE_APP_DEMO.poster}
              alt="ERPX mobile app dashboard showing revenue, receivables and stock"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={MOBILE_APP_DEMO.video}
              poster={MOBILE_APP_DEMO.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              aria-label={`ERPX mobile app demo — ${current.label}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </PhoneFrame>
      </div>
    </div>
  );
}
