"use client";

import type { SelectionStatus, Style } from "@/lib/types";
import Mono from "./Mono";
import StatusDot from "./StatusDot";
import StyleVisual from "./StyleVisual";
import DecisionButtons from "./DecisionButtons";
import { formatDisplayPrice, getFabricLabel, getPrimaryFabric } from "./palette";

export default function GalleryView({
  styles,
  getStatus,
  selectedId,
  onSelectStyle,
  onDecision,
}: {
  styles: Style[];
  getStatus: (style: Style) => SelectionStatus | null;
  selectedId: string | null;
  onSelectStyle: (id: string) => void;
  onDecision: (style: Style, status: SelectionStatus) => void;
}) {
  return (
    <div className="mock-gallery">
      {styles.map((style) => {
        const status = getStatus(style);
        const detail = getPrimaryFabric(style);
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
            <StyleVisual style={style} />
            <div className="mock-gallery-body">
              <div className="mock-gallery-title">
                <Mono>{style.id}</Mono>
                <Mono muted>{formatDisplayPrice(detail?.priceYd) ?? style.weight}</Mono>
              </div>
              <p>{getFabricLabel(style)}</p>
              <div className="mock-gallery-actions" onClick={(event) => event.stopPropagation()}>
                <StatusDot status={status} />
                <DecisionButtons current={status} onSelect={(decision) => onDecision(style, decision)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
