/**
 * Global keyboard shortcuts.
 *
 * Page shortcuts use Ctrl+Alt+<letter> (⌃⌥<letter> on macOS). Plain Ctrl+<letter>
 * is avoided because browsers own most of those (Ctrl+N/T/W/L/P/S/D/H/J...).
 * Each shortcut lists candidate pages in priority order; the first one the
 * current user can see in the sidebar wins, so e.g. Ctrl+Alt+A opens the
 * company attendance board for HR and "My Attendance" for everyone else.
 */

export type PageShortcut = {
  /** KeyboardEvent.code, layout-independent (Alt on macOS changes event.key). */
  code: string;
  /** Letter shown in the UI. */
  letter: string;
  label: string;
  group: string;
  /** Candidate URLs, most specific first. */
  urls: string[];
};

export const PAGE_SHORTCUTS: PageShortcut[] = [
  { code: "KeyD", letter: "D", label: "Dashboard", group: "General", urls: ["/dashboard"] },
  { code: "KeyN", letter: "N", label: "Notifications", group: "General", urls: ["/notifications"] },

  { code: "KeyC", letter: "C", label: "Customers", group: "Sales", urls: ["/sales/customers"] },
  { code: "KeyQ", letter: "Q", label: "Quotations", group: "Sales", urls: ["/sales/quotations"] },
  { code: "KeyI", letter: "I", label: "Invoices", group: "Sales", urls: ["/sales/invoices"] },

  { code: "KeyV", letter: "V", label: "Vendors", group: "Purchases", urls: ["/purchases/vendors"] },
  {
    code: "KeyO",
    letter: "O",
    label: "Purchase Orders",
    group: "Purchases",
    urls: ["/purchases/purchase-orders"],
  },
  { code: "KeyB", letter: "B", label: "Bills", group: "Purchases", urls: ["/purchases/bills"] },

  {
    code: "KeyP",
    letter: "P",
    label: "Products",
    group: "Inventory",
    urls: ["/inventory/products"],
  },

  {
    code: "KeyJ",
    letter: "J",
    label: "Journal Entries",
    group: "Accounting",
    urls: ["/accounting/journal-entries"],
  },

  { code: "KeyE", letter: "E", label: "Employees", group: "HRMS", urls: ["/hrms/employees"] },
  {
    code: "KeyA",
    letter: "A",
    label: "Attendance",
    group: "HRMS",
    urls: ["/hrms/attendance", "/hrms/my-attendance"],
  },
  {
    code: "KeyL",
    letter: "L",
    label: "Leave",
    group: "HRMS",
    urls: ["/hrms/leaves", "/hrms/my-leave"],
  },
  { code: "KeyY", letter: "Y", label: "Payroll", group: "HRMS", urls: ["/hrms/payroll"] },

  { code: "KeyU", letter: "U", label: "Users", group: "Administration", urls: ["/admin/users"] },
  {
    code: "KeyS",
    letter: "S",
    label: "Company Settings",
    group: "Administration",
    urls: ["/admin/settings"],
  },
];

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/**
 * Label for the "primary" modifier used by Ctrl+K / Ctrl+B / Ctrl+/ (⌘ on macOS).
 * Pass `mac` from `useIsMac()` in components so server and client render alike.
 */
export function primaryKeyLabel(key: string, mac: boolean): string {
  return mac ? `⌘${key}` : `Ctrl+${key}`;
}

/** Label for a page shortcut (Ctrl+Alt on Windows/Linux, ⌃⌥ on macOS). */
export function pageShortcutLabel(letter: string, mac: boolean): string {
  return mac ? `⌃⌥${letter}` : `Ctrl+Alt+${letter}`;
}

/** True for Ctrl+Alt (no Shift/Meta), the page-shortcut chord. */
export function isPageChord(e: KeyboardEvent): boolean {
  return e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey;
}

/** True when the user is typing, so single-key shortcuts must not fire. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file"].includes(
      type,
    );
  }
  return false;
}

/** First candidate URL of the shortcut that the user can open, or null. */
export function resolveShortcutUrl(
  shortcut: PageShortcut,
  visibleUrls: Set<string>,
): string | null {
  return shortcut.urls.find((u) => visibleUrls.has(u)) ?? null;
}

/**
 * Tally-style voucher keys (TallyPrime layout). Function keys type no
 * characters, so unlike page shortcuts these also work while a field has
 * focus, which is how Tally users switch voucher type mid-entry.
 * Browsers' own F5 (reload) and F7 (caret browsing) are suppressed on these
 * keys; the page must be focused for that to happen.
 */
export type TallyShortcut = {
  /** KeyboardEvent.key for function keys; KeyboardEvent.code for letters. */
  key: string;
  alt?: boolean;
  label: string;
  /** Short note shown in the help dialog. */
  hint: string;
} & ({ action: "navigate"; url: string; search?: Record<string, string> } | { action: "search" });

export const TALLY_SHORTCUTS: TallyShortcut[] = [
  {
    key: "F4",
    label: "Contra",
    hint: "Bank / cash transfer",
    action: "navigate",
    url: "/accounting/vouchers",
    search: { type: "contra" },
  },
  {
    key: "F5",
    label: "Payment",
    hint: "Money paid out",
    action: "navigate",
    url: "/accounting/vouchers",
    search: { type: "payment" },
  },
  {
    key: "F6",
    label: "Receipt",
    hint: "Money received",
    action: "navigate",
    url: "/accounting/vouchers",
    search: { type: "receipt" },
  },
  {
    key: "F7",
    label: "Journal",
    hint: "Adjustment entry",
    action: "navigate",
    url: "/accounting/vouchers",
    search: { type: "journal" },
  },
  { key: "F8", label: "Sales", hint: "Sales invoices", action: "navigate", url: "/sales/invoices" },
  {
    key: "F9",
    label: "Purchase",
    hint: "Purchase bills",
    action: "navigate",
    url: "/purchases/bills",
  },
  {
    key: "F7",
    alt: true,
    label: "Stock Journal",
    hint: "Stock movements",
    action: "navigate",
    url: "/inventory/stock-movements",
  },
  { key: "KeyG", alt: true, label: "Go To", hint: "Search pages and records", action: "search" },
];

/** Does this keydown match the Tally shortcut (exact modifiers, no Ctrl/Meta/Shift)? */
export function matchesTally(e: KeyboardEvent, s: TallyShortcut): boolean {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey !== !!s.alt) return false;
  return s.key.startsWith("Key") ? e.code === s.key : e.key === s.key;
}

export function tallyKeyLabel(s: TallyShortcut, mac: boolean): string {
  const key = s.key.startsWith("Key") ? s.key.slice(3) : s.key;
  if (!s.alt) return key;
  return mac ? `⌥${key}` : `Alt+${key}`;
}
