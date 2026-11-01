import { createFileRoute } from "@tanstack/react-router";

import { SITEMAP_PAGES, absoluteUrl } from "@/config/site";
import { SOLUTIONS } from "@/config/solutions";

// Bump when marketing copy changes so crawlers see a fresh <lastmod>.
const LAST_MODIFIED = "2026-11-01";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const pages = [
          ...SITEMAP_PAGES,
          ...SOLUTIONS.map((solution) => ({
            path: `/solutions/${solution.slug}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
        ];
        const urls = pages.map(
          (page) =>
            `  <url>\n    <loc>${absoluteUrl(page.path)}</loc>\n    <lastmod>${LAST_MODIFIED}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
        ).join("\n");
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
