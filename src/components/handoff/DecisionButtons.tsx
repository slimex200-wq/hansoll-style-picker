"use client";

import type { SelectionStatus } from "@/lib/types";
import { STATUS_META } from "./palette";

export default function DecisionButtons({
  current,
  onSelect,
  variant = "default",
}: {
  current: SelectionStatus | null;
  onSelect: (status: SelectionStatus) => void;
  variant?: "default" | "gallery";
}) {
  const className =
    variant === "gallery" ? "mock-decision-buttons gallery" : "mock-decision-buttons";
  return (
    <div className={className}>
      {(Object.keys(STATUS_META) as SelectionStatus[]).map((status) => {
        const active = current === status;
        const meta = STATUS_META[status];
        return (
          <button
            key={status}
            className={active ? "active" : ""}
            style={
              active
                ? { borderColor: meta.color, background: meta.bg, color: meta.color }
                : undefined
            }
            onClick={() => onSelect(status)}
            aria-label={`Mark ${meta.label}`}
          >
            {variant === "gallery" ? meta.label : meta.label.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}
