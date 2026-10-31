/**
 * Public marketing site configuration.
 *
 * `VITE_SITE_URL` should be set to the canonical public origin (for example
 * https://erpx.com) so per-route canonical/OG URLs are absolute. When it is
 * absent we fall back to the current production frontend deployment.
 */
const rawSiteUrl =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || "https://erpx-frontend.vercel.app";

export const SITE = {
  name: "ERPX",
  compactName: "ERPX",
  tagline: "The operating system for modern businesses",
  description:
    "Run accounting, sales, inventory, CRM and HR on one GST-ready platform with role-based access, per-company isolation and an audit trail on every entry.",
  url: rawSiteUrl.replace(/\/+$/, ""),
} as const;

export const OG_IMAGE = "/mockups/og-cover.png";

/** Paths that render the public marketing shell instead of the app shell. */
export const MARKETING_PATHS = ["/", "/product", "/pricing", "/demo"] as const;

export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MARKETING_PATHS.some(
    (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

/**
 * Builds the `head()` payload shared by every marketing route (title,
 * description, canonical URL and Open Graph/Twitter cards).
 */
export function seoHead({ title, description, path, image = OG_IMAGE }: SeoInput) {
  const url = `${SITE.url}${path}`;
  const ogImage = `${SITE.url}${image}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
