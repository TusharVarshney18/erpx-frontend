"use client";

import { forwardRef, useState } from "react";
import { Search, Command, X } from "lucide-react";
import { cn } from "../../lib/cn";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div
        className={cn(
          "relative flex items-center w-full max-w-sm",
          "rounded-lg border border-input bg-background",
          "transition-all duration-150",
          focused && "border-ring ring-1 ring-ring",
          className,
        )}
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={placeholder}
          className={cn(
            "flex h-9 w-full bg-transparent pl-9 pr-16 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...props}
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {value && (
            <button
              onClick={onClear}
              className="p-0.5 rounded hover:bg-accent transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
export type { SearchInputProps };
