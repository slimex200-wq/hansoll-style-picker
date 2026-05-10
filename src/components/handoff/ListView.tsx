"use client";

import type { SelectionStatus, Style } from "@/lib/types";
import Mono from "./Mono";
import StatusDot from "./StatusDot";
import StyleVisual from "./StyleVisual";
import DecisionButtons from "./DecisionButtons";
import { formatDisplayPrice, getFabricLabel, getPrimaryFabric } from "./palette";

export default function ListView({
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
    <div className="mock-list">
      <div className="mock-list-head">
        <Mono muted>#</Mono>
        <Mono muted>Image</Mono>
        <Mono muted>Style</Mono>
        <Mono muted>Garment fabric</Mono>
        <Mono muted>Weight</Mono>
        <Mono muted>Matched fabric</Mono>
        <Mono muted>YD price</Mono>
        <Mono muted>Status</Mono>
        <Mono muted>Quick</Mono>
      </div>
      {styles.map((style, index) => {
        const detail = getPrimaryFabric(style);
        const rowPrice = formatDisplayPrice(detail?.priceYd);
        const status = getStatus(style);
        return (
          <div
            key={style.id}
            role="button"
            tabIndex={0}
            aria-label={`View details for style ${style.id}`}
            className={selectedId === style.id ? "mock-list-row selected" : "mock-list-row"}
            onClick={() => onSelectStyle(style.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectStyle(style.id);
              }
            }}
          >
            <Mono muted>{String(index + 1).padStart(2, "0")}</Mono>
            <StyleVisual style={style} className="thumb" />
            <div className="mock-row-code">
              <Mono>{style.id}</Mono>
              <span>{style.division}</span>
              {rowPrice && <em>{rowPrice}</em>}
            </div>
            <span className="mock-truncate">{getFabricLabel(style)}</span>
            <Mono muted>{style.weight || detail?.weightGm2 || "-"}</Mono>
            <span className="mock-truncate">{detail?.fabricCode || style.fabric_suggestion?.fabric_no || "-"}</span>
            <Mono>{formatDisplayPrice(detail?.priceYd) ?? "-"}</Mono>
            <StatusDot status={status} />
            <span onClick={(event) => event.stopPropagation()}>
              <DecisionButtons current={status} onSelect={(decision) => onDecision(style, decision)} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
