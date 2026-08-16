"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string[];
  category?: string;
  onClick: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  open: boolean;
  onClose: () => void;
  placeholder?: string;
}

export function CommandPalette({
  items,
  open,
  onClose,
  placeholder = "Search commands...",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            filtered[selectedIndex].onClick();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
            className="fixed left-1/2 top-[15%] z-[131] w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-popover shadow-dialog">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>

              <div className="max-h-72 overflow-y-auto p-2" role="listbox">
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground/60">Try a different search term</p>
                  </div>
                )}

                {filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    role="option"
                    aria-selected={i === selectedIndex}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      i === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/70 hover:bg-accent/50",
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="truncate w-full text-left font-medium">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground truncate w-full text-left">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {item.shortcut && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {item.shortcut.map((key, ki) => (
                          <kbd
                            key={ki}
                            className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
