import { createFileRoute } from "@tanstack/react-router";

import { CRAWL_DISALLOW, SITE } from "@/config/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          ...CRAWL_DISALLOW.map((path) => `Disallow: ${path}`),
          "",
          `Sitemap: ${SITE.url}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
