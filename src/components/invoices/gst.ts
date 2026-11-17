export const GST_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

const squash = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const ALIASES: Record<string, string> = {
  orissa: "21",
  pondicherry: "34",
  newdelhi: "07",
  nctofdelhi: "07",
  uttaranchal: "05",
  jammuandkashmir: "01",
  damananddiu: "26",
  dadraandnagarhaveli: "26",
};

/**
 * Canonical 2-digit GST state code for "27", "27-Maharashtra", "Maharashtra",
 * "maharashtra " etc. Returns "" when the value is not recognised.
 * Mirrors the backend resolver so the badge and the saved tax always agree.
 */
export function toStateCode(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const lead = raw.match(/^(d{1,2})(?:D|$)/);
  if (lead) {
    const code = lead[1].padStart(2, "0");
    return GST_STATES.some((s) => s.code === code) ? code : "";
  }
  const key = squash(raw);
  return GST_STATES.find((s) => squash(s.name) === key)?.code ?? ALIASES[key] ?? "";
}

/** State code from a GSTIN's first two digits, or "". */
export function stateCodeFromGstin(gstin?: string | null): string {
  const m = String(gstin ?? "").trim().match(/^(d{2})[A-Z0-9]{13}$/i);
  return m && GST_STATES.some((s) => s.code === m[1]) ? m[1] : "";
}

export function stateName(code?: string | null): string {
  if (!code) return "";
  return GST_STATES.find((s) => s.code === code)?.name ?? code;
}
