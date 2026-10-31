import { z } from "zod";

import { FREE_EMAIL_DOMAINS, TEAM_SIZES } from "@/config/marketing";

/**
 * Validation shared by the demo form (client) and the lead-capture server
 * function. Work email is required so sales can reply to a company address.
 */
export const demoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is a little too long."),
  workEmail: z
    .string()
    .trim()
    .min(1, "Work email is required.")
    .email("Enter a valid email address.")
    .max(200, "That email is too long.")
    .refine((value) => {
      const domain = value.split("@")[1]?.toLowerCase();
      return Boolean(domain) && !FREE_EMAIL_DOMAINS.includes(domain);
    }, "Please use your work email — not a personal inbox."),
  company: z
    .string()
    .trim()
    .min(2, "Please enter your company name.")
    .max(160, "That company name is a little too long."),
  teamSize: z
    .string()
    .trim()
    .min(1, "Select your team size.")
    .refine(
      (value) => (TEAM_SIZES as readonly string[]).includes(value),
      "Select a valid team size.",
    ),
  message: z.string().trim().max(1000, "Please keep this under 1,000 characters.").optional(),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().optional(),
});

export type DemoFormValues = z.infer<typeof demoFormSchema>;
