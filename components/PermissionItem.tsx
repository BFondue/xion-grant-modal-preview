"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Permission } from "@/lib/types";

export function PermissionItem({
  label,
  description,
  expandable,
  index = 0,
}: Permission & { index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const delay = index * 200;
    const startTimer = setTimeout(() => setPulsing(true), delay);
    const endTimer = setTimeout(() => setPulsing(false), delay + 600);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [index]);

  return (
    <div
      className={cn(
        "rounded-[8px] px-phi-md py-phi-sm -mx-phi-md transition-colors duration-normal",
        expandable && pulsing && "bg-surface-page",
        expandable && !pulsing && "hover:bg-surface-page/60"
      )}
    >
      <button
        type="button"
        onClick={() => expandable && setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-phi-md text-left",
          expandable && "cursor-pointer"
        )}
      >
        <span className="mt-[2px] h-[6px] w-[6px] flex-shrink-0 rounded-full bg-accent-trust" />
        <span className="flex-1 text-body text-text-primary">{label}</span>
        {expandable && (
          <ChevronDown
            size={16}
            className={cn(
              "flex-shrink-0 text-text-muted transition-transform duration-fast",
              expanded && "rotate-180"
            )}
          />
        )}
      </button>

      {expandable && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-normal",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <p className="pl-[16px] pt-phi-xs text-caption text-text-muted">
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
