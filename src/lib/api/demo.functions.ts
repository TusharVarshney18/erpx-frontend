import { createServerFn } from "@tanstack/react-start";

import { demoFormSchema } from "../demo-schema";

/**
 * Public demo-request endpoint used by `/demo`.
 *
 * Runs server-side (TanStack Start server function). Replace the handler body
 * with a call to a real leads API when one exists; the client contract stays
 * the same (`{ ok, receivedAt }`).
 */
export const submitDemoRequest = createServerFn({ method: "POST" })
  .validator(demoFormSchema)
  .handler(async ({ data }) => {
    // Honeypot submissions get a success response so bots do not retry.
    if (data.website && data.website.trim().length > 0) {
      return { ok: true as const, receivedAt: new Date().toISOString() };
    }

    const { captureDemoLead } = await import("../demo.server");
    return captureDemoLead(data);
  });
