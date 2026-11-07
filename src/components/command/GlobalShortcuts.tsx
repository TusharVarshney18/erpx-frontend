import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShortcutTargets, type ShortcutTarget } from "@/hooks/useShortcutTargets";
import { useIsMac } from "@/hooks/useIsMac";
import {
  isEditableTarget,
  isPageChord,
  matchesTally,
  pageShortcutLabel,
  primaryKeyLabel,
  tallyKeyLabel,
} from "@/lib/shortcuts";

/**
 * Registers the app-wide keyboard shortcuts and renders the "Keyboard
 * shortcuts" help dialog.
 *
 *   F4 F5 F6 F7 F8 F9, Alt+F7, Alt+G     Tally-style voucher keys (work while typing)
 *   Ctrl+Alt+<letter>  (⌃⌥ on macOS)  open a page (only pages the user can see)
 *   Ctrl+/  or  ?                       show this list
 *
 * Ctrl+K (search) lives in TopHeader and Ctrl+B (sidebar) in the sidebar
 * component; they are listed here so the dialog is the one place to look.
 */
export function GlobalShortcuts({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const { targets, tally } = useShortcutTargets();
  const [helpOpen, setHelpOpen] = useState(false);
  const mac = useIsMac();

  // Read the latest values inside the stable keydown listener.
  const latest = useRef({ targets, tally, onOpenSearch });
  latest.current = { targets, tally, onOpenSearch };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // Tally keys: F4 Contra, F5 Payment, F6 Receipt, F7 Journal, F8 Sales,
      // F9 Purchase, Alt+F7 Stock Journal, Alt+G Go To. Checked before the
      // repeat guard so a held F5 never falls through to a browser reload.
      const tallyHit = latest.current.tally.find((s) => matchesTally(e, s));
      if (tallyHit) {
        e.preventDefault();
        if (e.repeat) return;
        setHelpOpen(false);
        if (tallyHit.action === "search") latest.current.onOpenSearch();
        else navigate({ to: tallyHit.url, search: tallyHit.search ?? {} });
        return;
      }

      if (e.repeat) return;

      // Ctrl+/ (⌘/ on macOS): toggle the help dialog, even while typing.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === "/") {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      const typing = isEditableTarget(e.target);

      // "?" opens the help dialog when the user is not typing.
      if (!typing && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Ctrl+Alt+<letter>: open a page. Skipped inside text fields because on
      // AltGr keyboard layouts Ctrl+Alt+<letter> types a character (e.g. €).
      if (!typing && isPageChord(e)) {
        const hit = latest.current.targets.find((t) => t.shortcut.code === e.code);
        if (!hit) return;
        e.preventDefault();
        setHelpOpen(false);
        navigate({ to: hit.url });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const groups = useMemo(() => groupTargets(targets), [targets]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Tally keys work everywhere, even inside a field. Page shortcuts work anywhere except
            while typing.
          </DialogDescription>
        </DialogHeader>

        {tally.length > 0 && (
          <ShortcutSection
            title="Tally-style vouchers"
            rows={tally.map((s) => ({
              label: `${s.label} · ${s.hint}`,
              keys: tallyKeyLabel(s, mac),
            }))}
          />
        )}

        <ShortcutSection
          title="General"
          rows={[
            { label: "Search pages and records", keys: primaryKeyLabel("K", mac) },
            { label: "Show or hide the sidebar", keys: primaryKeyLabel("B", mac) },
            { label: "Show keyboard shortcuts", keys: `${primaryKeyLabel("/", mac)}  or  ?` },
          ]}
        />

        {groups.map(([group, items]) => (
          <ShortcutSection
            key={group}
            title={group}
            rows={items.map((t) => ({
              label: t.title,
              keys: pageShortcutLabel(t.shortcut.letter, mac),
            }))}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
}

function ShortcutSection({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; keys: string }[];
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>{row.label}</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {row.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </section>
  );
}

function groupTargets(targets: ShortcutTarget[]): [string, ShortcutTarget[]][] {
  const map = new Map<string, ShortcutTarget[]>();
  for (const t of targets) {
    if (!map.has(t.shortcut.group)) map.set(t.shortcut.group, []);
    map.get(t.shortcut.group)!.push(t);
  }
  return [...map.entries()];
}
