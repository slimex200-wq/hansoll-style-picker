"use client";

import type { SelectionStatus, Style } from "@/lib/types";
import Mono from "./Mono";
import StyleVisual from "./StyleVisual";
import DecisionButtons from "./DecisionButtons";
import {
  STATUS_META,
  formatDisplayPrice,
  getFabricLabel,
  getPrimaryFabric,
} from "./palette";

export default function GalleryView({
  styles,
  getStatus,
  selectedId,
  onSelectStyle,
  onDecision,
  getMemoCount,
}: {
  styles: Style[];
  getStatus: (style: Style) => SelectionStatus | null;
  selectedId: string | null;
  onSelectStyle: (id: string) => void;
  onDecision: (style: Style, status: SelectionStatus) => void;
  getMemoCount?: (style: Style) => number;
}) {
  return (
    <div className="mock-gallery">
      {styles.map((style) => {
        const status = getStatus(style);
        const detail = getPrimaryFabric(style);
        const meta = status ? STATUS_META[status] : null;
        const memoCount = getMemoCount?.(style) ?? 0;
        return (
          <div
            key={style.id}
            role="button"
            tabIndex={0}
            aria-label={`View details for style ${style.id}`}
            className={selectedId === style.id ? "mock-gallery-card selected" : "mock-gallery-card"}
            onClick={() => onSelectStyle(style.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectStyle(style.id);
              }
            }}
          >
            <div className="mock-gallery-hero">
              <StyleVisual style={style} />
              {meta && (
                <span
                  className="mock-gallery-status-pill"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: meta.color,
                    }}
                  />
                  {meta.label}
                </span>
              )}
              {memoCount > 0 && (
                <span className="mock-gallery-memo-pill">
                  {memoCount} memo{memoCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="mock-gallery-body">
              <div className="mock-gallery-title">
                <Mono>{style.id}</Mono>
                <Mono muted>{formatDisplayPrice(detail?.priceYd) ?? style.weight}</Mono>
              </div>
              <p>{getFabricLabel(style)}</p>
              <div
                className="mock-gallery-actions"
                onClick={(event) => event.stopPropagation()}
              >
                <DecisionButtons
                  current={status}
                  onSelect={(decision) => onDecision(style, decision)}
                  variant="gallery"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
