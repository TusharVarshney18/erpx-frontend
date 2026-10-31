import type { ReactNode } from "react";

import "./marketing.css";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SupportBot } from "./SupportBot";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-root">
      <a href="#main" className="m-skip">
        Skip to content
      </a>
      <div className="marketing-backdrop" aria-hidden="true" />
      <div className="marketing-grid" aria-hidden="true" />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <SupportBot />
    </div>
  );
}
