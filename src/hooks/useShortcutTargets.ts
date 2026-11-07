import { useMemo } from "react";
import { useAccess } from "@/hooks/useAccess";
import { getVisibleNavigation } from "@/lib/navigation-access";
import {
  PAGE_SHORTCUTS,
  TALLY_SHORTCUTS,
  resolveShortcutUrl,
  type PageShortcut,
  type TallyShortcut,
} from "@/lib/shortcuts";

/** `title` is the sidebar title of the resolved page (e.g. "My Attendance"). */
export type ShortcutTarget = { shortcut: PageShortcut; url: string; title: string };

/**
 * Page shortcuts the current user can actually use, resolved to a URL.
 * Built from the same visible-navigation tree as the sidebar, so a shortcut
 * never opens a page the user has no permission for. Plan-locked pages are
 * left out (the sidebar routes those through the upgrade prompt instead).
 */
export function useShortcutTargets(): {
  targets: ShortcutTarget[];
  byUrl: Map<string, PageShortcut>;
  /** Tally voucher keys whose page the user can open (Go To is always on). */
  tally: TallyShortcut[];
} {
  const access = useAccess();

  return useMemo(() => {
    const titles = new Map<string, string>();
    for (const group of getVisibleNavigation(access.context)) {
      for (const item of group.items) {
        const leaves = item.children ?? [item];
        for (const leaf of leaves) {
          if (leaf.url && !leaf.locked) titles.set(leaf.url, leaf.title);
        }
      }
    }
    const visible = new Set(titles.keys());

    const targets: ShortcutTarget[] = [];
    const byUrl = new Map<string, PageShortcut>();
    for (const shortcut of PAGE_SHORTCUTS) {
      const url = resolveShortcutUrl(shortcut, visible);
      if (!url) continue;
      targets.push({ shortcut, url, title: titles.get(url) ?? shortcut.label });
      byUrl.set(url, shortcut);
    }
    const tally = TALLY_SHORTCUTS.filter((s) => s.action !== "navigate" || visible.has(s.url));
    return { targets, byUrl, tally };
  }, [access.context]);
}
