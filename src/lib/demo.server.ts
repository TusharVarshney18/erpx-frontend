import process from "node:process";

import type { DemoFormValues } from "./demo-schema";

export type DemoLeadResult = {
  ok: true;
  receivedAt: string;
};

/**
 * Minimal lead-capture stub.
 *
 * There is no public demo/lead endpoint on the API yet, so this captures the
 * request server-side. Set `DEMO_LEADS_WEBHOOK_URL` (server-only env var) to
 * forward leads to a CRM, Slack workflow or automation. Until then the lead is
 * written to the server logs so nothing is silently lost.
 */
export async function captureDemoLead(input: DemoFormValues): Promise<DemoLeadResult> {
  const receivedAt = new Date().toISOString();
  const lead = {
    name: input.name,
    workEmail: input.workEmail,
    company: input.company,
    teamSize: input.teamSize,
    message: input.message?.trim() || null,
    source: "marketing-demo",
    submittedAt: receivedAt,
  };

  const webhook = process.env.DEMO_LEADS_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!response.ok) {
        console.error(`[demo-lead] webhook responded with ${response.status}`);
      }
    } catch (error) {
      console.error("[demo-lead] webhook delivery failed", error);
    }
  }

  console.log("[demo-lead]", JSON.stringify(lead));
  return { ok: true, receivedAt };
}
