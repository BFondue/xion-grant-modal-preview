"use client";

import { cn } from "@/lib/utils";
import { ModalState } from "@/lib/types";

const TABS: { label: string; value: ModalState }[] = [
  { label: "Approve", value: "approve" },
  { label: "Security Warning", value: "security-warning" },
  { label: "Loading", value: "loading" },
  { label: "Success", value: "success" },
  { label: "Error", value: "error" },
];

interface StateTabsProps {
  current: ModalState;
  onChange: (state: ModalState) => void;
}

export function StateTabs({ current, onChange }: StateTabsProps) {
  return (
    <div className="mb-phi-xl flex flex-wrap items-center justify-center gap-phi-xs">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full px-phi-lg py-phi-sm text-body transition-colors duration-fast",
            current === tab.value
              ? "bg-cta text-white"
              : "bg-surface-border text-text-secondary hover:bg-gray-300"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
