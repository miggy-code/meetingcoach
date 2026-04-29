"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Collapsible({
  label,
  children,
  defaultOpen = false,
  icon,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-lg border bg-surface", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-surface-2"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t px-4 py-4 text-sm text-text">{children}</div>
      )}
    </div>
  );
}
