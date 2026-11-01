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
export const MARKETING_PATHS = ["/", "/product", "/solutions", "/pricing", "/demo"] as const;

export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MARKETING_PATHS.some(
    (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}

/** Indexable public pages, used to build `/sitemap.xml`. */
export const SITEMAP_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/product", changefreq: "monthly", priority: "0.8" },
  { path: "/solutions", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/demo", changefreq: "monthly", priority: "0.6" },
];

/** App/auth path prefixes that crawlers should skip (see `/robots.txt`). */
export const CRAWL_DISALLOW = [
  "/dashboard",
  "/auth",
  "/accept-invite",
  "/invite/",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/notifications",
  "/accounting",
  "/admin",
  "/banking",
  "/crm",
  "/hrms",
  "/inventory",
  "/operations",
  "/purchases",
  "/reports",
  "/sales",
  "/security",
  "/super-admin",
];

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Schema.org Organization + WebSite graph, rendered on the home page. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: `${SITE.url}/`,
        logo: absoluteUrl("/icon-192.png"),
        description: SITE.description,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: `${SITE.url}/`,
        description: SITE.tagline,
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    ],
  };
}

/** Schema.org SoftwareApplication describing ERPX itself. */
export function softwareApplicationJsonLd(offers?: { name: string; price: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Enterprise Resource Planning",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE.url}/`,
    image: absoluteUrl(OG_IMAGE),
    description: SITE.description,
    publisher: { "@id": `${SITE.url}/#organization` },
    ...(offers && offers.length > 0
      ? {
          offers: offers.map((offer) => ({
            "@type": "Offer",
            name: offer.name,
            price: offer.price.toFixed(2),
            priceCurrency: "INR",
            url: absoluteUrl("/pricing"),
          })),
        }
      : {}),
  };
}

/** Schema.org BreadcrumbList for a top-level marketing page. */
export function breadcrumbJsonLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  };
}

/** Schema.org FAQPage built from visible question/answer pairs. */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  /** Schema.org objects emitted as `application/ld+json` scripts. */
  jsonLd?: Record<string, unknown>[];
};

/**
 * Builds the `head()` payload shared by every marketing route (title,
 * description, canonical URL, robots, Open Graph/Twitter cards and
 * structured data). Marketing routes override the root route's `noindex`.
 */
export function seoHead({
  title,
  description,
  path,
  image = OG_IMAGE,
  imageAlt = `${SITE.name} — ${SITE.tagline}`,
  jsonLd = [],
}: SeoInput) {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: "en_IN" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { property: "og:image:secure_url", content: ogImage },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [{ rel: "canonical", href: url }],
    // Escape "<" so JSON content can never close the <script> tag early.
    scripts: jsonLd.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data).replace(/</g, "\\u003c"),
    })),
  };
}
