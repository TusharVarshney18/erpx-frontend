import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { to: "/product", label: "Product" },
  { to: "/solutions", label: "Solutions" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const accountHref = user ? "/dashboard" : "/auth";
  const accountLabel = user ? "Dashboard" : "Sign in";

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070d1a]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((item) => {
            const active =
              location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "m-nav-link",
                  active && "bg-white/[0.06] text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to={accountHref} className="m-nav-link">
            {accountLabel}
          </Link>
          <Link to="/demo" className="m-btn-primary m-btn-sm">
            Book demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08] lg:hidden"
          aria-expanded={open}
          aria-controls="marketing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="marketing-mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="border-t border-white/[0.07] bg-[#070d1a]/97 backdrop-blur-2xl lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl space-y-1 px-4 py-4 sm:px-6">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-lg px-3 py-3 text-[15px] font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={accountHref}
            className="block rounded-lg px-3 py-3 text-[15px] font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </Link>
          <Link
            to="/demo"
            className="m-btn-primary mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            Book demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
