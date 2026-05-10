"use client";

import type { SelectionStatus } from "@/lib/types";
import { STATUS_META } from "./palette";

export default function StatusDot({ status }: { status: SelectionStatus | null }) {
  if (!status) return <span className="mock-status empty">Unreviewed</span>;
  const meta = STATUS_META[status];
  return (
    <span className="mock-status" style={{ color: meta.color, background: meta.bg }}>
      <span style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
