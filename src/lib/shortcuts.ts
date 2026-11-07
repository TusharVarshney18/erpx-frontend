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
