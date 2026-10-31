import { Link } from "@tanstack/react-router";

import { MODULES } from "@/config/marketing";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

const PLATFORM_LINKS = [
  { to: "/product", label: "Product overview" },
  { to: "/pricing", label: "Pricing" },
  { to: "/demo", label: "Book a demo" },
] as const;

export function SiteFooter() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.07] bg-[#050913]/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              One connected workspace for accounting, sales, inventory, CRM and people — built for
              modern businesses.
            </p>
            <p className="mt-4 text-xs text-white/40">
              GST-ready · Role-based access · Audit trail on every entry
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Platform
            </h2>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={user ? "/dashboard" : "/auth"}
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  {user ? "Go to dashboard" : "Sign in"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Modules
            </h2>
            <ul className="mt-4 space-y-2.5">
              {MODULES.map((module) => (
                <li key={module.id}>
                  <Link
                    to="/product"
                    hash={module.id}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {module.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Get started
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/auth"
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  Create a workspace
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  Compare plans
                </Link>
              </li>
              <li>
                <Link
                  to="/demo"
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  Talk to our team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ERPX. All rights reserved.</p>
          <p>Built for businesses that have outgrown spreadsheets.</p>
        </div>
      </div>
    </footer>
  );
}
