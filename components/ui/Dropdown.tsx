"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export interface DropdownOption {
  value: string;
  label: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 text-sm text-text-primary outline-none transition-colors hover:border-brand-blue/40 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      >
        <span className="truncate">{selected?.label ?? ariaLabel}</span>
        <IconChevronDown className={cn("h-4 w-4 shrink-0 text-text-secondary transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 max-h-64 w-full min-w-[10rem] overflow-y-auto rounded-[var(--radius-control)] border border-border-subtle bg-surface p-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-[calc(var(--radius-control)-4px)] px-3 py-2 text-left text-sm transition-colors",
                  option.value === value
                    ? "bg-brand-blue/15 font-medium text-brand-blue"
                    : "text-text-primary hover:bg-surface-hover"
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
