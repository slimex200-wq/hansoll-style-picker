"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { SelectionStatus, Style } from "@/lib/types";
import Mono from "./Mono";
import StatusDot from "./StatusDot";
import StyleVisual from "./StyleVisual";
import { PALETTE, getFabricLabel } from "./palette";

export default function SummaryModal({
  styles,
  collectionLabel,
  getStatus,
  onClose,
}: {
  styles: Style[];
  collectionLabel: string;
  getStatus: (style: Style) => SelectionStatus | null;
  onClose: () => void;
}) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture focus origin on mount; restore on unmount.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // ESC closes the modal even if focus is inside the dialog body.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let unreviewed = 0;
  let pick = 0;
  let hold = 0;
  let skip = 0;
  for (const style of styles) {
    const status = getStatus(style);
    if (!status) unreviewed += 1;
    else if (status === "shortlist") pick += 1;
    else if (status === "maybe") hold += 1;
    else if (status === "pass") skip += 1;
  }
  const reviewed = styles.length - unreviewed;

  const cards: Array<{ label: string; value: string; color: string }> = [
    { label: "Reviewed", value: `${reviewed} / ${styles.length}`, color: PALETTE.ink },
    { label: "Pick", value: String(pick), color: PALETTE.sage },
    { label: "Hold", value: String(hold), color: PALETTE.amber },
    { label: "Skip", value: String(skip), color: PALETTE.peach },
  ];

  return (
    <div
      className="mock-summary-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="mock-summary-card"
        role="dialog"
        aria-modal="true"
        aria-label="Selection summary"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mock-summary-header">
          <div>
            <div className="mock-summary-title">Selection summary</div>
            <Mono muted>
              {collectionLabel} Talbots Outlet &middot; {styles.length} styles
            </Mono>
          </div>
          <button
            type="button"
            className="mock-summary-close"
            onClick={onClose}
            aria-label="Close summary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mock-summary-counts">
          {cards.map((card) => (
            <div key={card.label} className="mock-summary-count-card">
              <Mono muted>{card.label}</Mono>
              <div
                className="mock-summary-count-value"
                style={{ color: card.color }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mock-summary-table">
          <div className="mock-summary-row mock-summary-row-head">
            <Mono muted>#</Mono>
            <Mono muted>Img</Mono>
            <Mono muted>Code</Mono>
            <Mono muted>Fabric</Mono>
            <Mono muted>Weight</Mono>
            <Mono muted>Status</Mono>
          </div>
          {styles.map((style, index) => (
            <div key={style.id} className="mock-summary-row">
              <Mono muted>{String(index + 1).padStart(2, "0")}</Mono>
              <StyleVisual style={style} className="thumb" />
              <Mono>{style.id}</Mono>
              <span className="mock-truncate">{getFabricLabel(style)}</span>
              <Mono muted>{style.weight || "-"}</Mono>
              <StatusDot status={getStatus(style)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
