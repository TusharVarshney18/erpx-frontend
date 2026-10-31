import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BrowserFrame({
  src,
  alt,
  url,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  url: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("browser-frame", className)}>
      <div className="browser-frame__bar">
        <span className="browser-frame__dots" aria-hidden="true">
          <span className="browser-frame__dot" />
          <span className="browser-frame__dot" />
          <span className="browser-frame__dot" />
        </span>
        <span className="browser-frame__url">{url}</span>
      </div>
      <img
        src={src}
        alt={alt}
        className="block h-auto w-full"
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("phone-frame", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-roledescription={label ? "device mockup" : undefined}
    >
      <div className="phone-frame__screen">{children}</div>
      <span className="phone-frame__notch" aria-hidden="true" />
      <span className="phone-frame__button" aria-hidden="true" />
      <span className="phone-frame__home" aria-hidden="true" />
    </div>
  );
}
