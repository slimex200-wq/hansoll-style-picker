"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Memo, SelectionStatus, Style } from "@/lib/types";
import { formatTimeAgo } from "@/lib/store";
import Mono from "./Mono";
import StyleVisual from "./StyleVisual";
import FabricTexture from "./FabricTexture";
import { STATUS_META, formatDisplayPrice, getFabricRows, joinParts } from "./palette";

export default function DetailPanel({
  style,
  status,
  onDecision,
  onPrev,
  onNext,
  index,
  total,
  memos,
  hasMoreMemos,
  onAddMemo,
  onLoadMoreMemos,
  onOpenLightbox,
}: {
  style: Style;
  status: SelectionStatus | null;
  onDecision: (status: SelectionStatus) => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
  memos?: Memo[];
  hasMoreMemos?: boolean;
  onAddMemo?: (content: string) => Promise<void> | void;
  onLoadMoreMemos?: () => Promise<void> | void;
  onOpenLightbox?: () => void;
}) {
  const [visualTab, setVisualTab] = useState<"garment" | "fabric" | "detail">("garment");
  const [memoDraft, setMemoDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fabricRows = getFabricRows(style);
  const primary = fabricRows[0] ?? null;
  const detailPrice = formatDisplayPrice(primary?.priceYd);

  // Reset draft when style switches.
  useEffect(() => {
    setMemoDraft("");
  }, [style.id]);

  const handleSend = async () => {
    const content = memoDraft.trim();
    if (!content || !onAddMemo || sending) return;
    setSending(true);
    try {
      await onAddMemo(content);
      setMemoDraft("");
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = async () => {
    if (!onLoadMoreMemos || loadingMore) return;
    setLoadingMore(true);
    try {
      await onLoadMoreMemos();
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <aside className="mock-detail">
      <div className="mock-detail-nav">
        <div>
          <button onClick={onPrev} aria-label="Previous style">
            <ChevronLeft size={14} />
          </button>
          <button onClick={onNext} aria-label="Next style">
            <ChevronRight size={14} />
          </button>
        </div>
        <Mono muted>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </Mono>
      </div>

      <div className="mock-detail-hero">
        {visualTab === "garment" && (
          onOpenLightbox ? (
            <button
              type="button"
              className="mock-detail-hero-button"
              onClick={onOpenLightbox}
              aria-label={`Open ${style.id} garment images`}
            >
              <StyleVisual style={style} />
            </button>
          ) : (
            <StyleVisual style={style} />
          )
        )}
        {visualTab === "fabric" && <FabricTexture style={style} />}
        {visualTab === "detail" && (
          <div className="mock-detail-closeup">
            <FabricTexture style={style} />
            <div />
            <span>neckline / stitch detail</span>
          </div>
        )}
      </div>

      <div className="mock-thumb-tabs">
        {(["garment", "fabric", "detail"] as const).map((tab) => (
          <button key={tab} className={visualTab === tab ? "active" : ""} onClick={() => setVisualTab(tab)}>
            <span>{tab}</span>
          </button>
        ))}
      </div>

      <div className="mock-detail-scroll">
        <section className="mock-detail-section">
          <Mono muted>Style</Mono>
          <h2>{style.id}</h2>
          <p>{joinParts(style.contents, style.construction, style.weight)}</p>
          {detailPrice && (
            <div className="mock-detail-price">
              <span>YD price</span>
              <b>{detailPrice}</b>
            </div>
          )}
          <div className="mock-meta-grid">
            <span>Division</span>
            <b>{style.division}</b>
            <span>Original fabric</span>
            <b>{style.fabric_no || "-"}</b>
            <span>Designer</span>
            <b>{style.designed_by || "Hansoll"}</b>
          </div>
        </section>

        <section className="mock-detail-section">
          <div className="mock-section-header">
            <Mono muted>Matched fabric</Mono>
            <span>{fabricRows.length || (style.fabric_suggestion ? 1 : 0)} match</span>
          </div>
          {fabricRows.length > 0 ? (
            <div className="mock-fabric-list">
              {fabricRows.map((detail, detailIndex) => (
                <div
                  key={`${detail.styleId}-${detail.fabricCode}-${detail.option}-${detailIndex}`}
                  className="mock-fabric-card"
                >
                  <div className="mock-fabric-card-head">
                    <b>{detail.fabricCode || detail.originalText || "Mapped fabric"}</b>
                    {detail.option && <span>{detail.option}</span>}
                  </div>
                  <p>{joinParts(detail.supplier, detail.fabricCountry)}</p>
                  <p>
                    {joinParts(
                      detail.construction,
                      detail.content,
                      detail.widthInch && `W ${detail.widthInch}"`,
                      detail.weightGm2 && `${detail.weightGm2} g/m2`
                    )}
                  </p>
                  {formatDisplayPrice(detail.priceYd) && (
                    <div className="mock-price-line">
                      <span>YD price</span>
                      <b>{formatDisplayPrice(detail.priceYd)}</b>
                    </div>
                  )}
                  {detail.finish && <p>Finish: {detail.finish}</p>}
                  {detail.comment && <small>{detail.comment}</small>}
                </div>
              ))}
            </div>
          ) : style.fabric_suggestion ? (
            <div className="mock-fabric-card">
              <div className="mock-fabric-card-head">
                <b>{style.fabric_suggestion.fabric_no}</b>
                <span>suggestion</span>
              </div>
              <p>{joinParts(style.fabric_suggestion.contents, style.fabric_suggestion.weight)}</p>
            </div>
          ) : (
            <p className="mock-empty-copy">No mapped fabric detail yet.</p>
          )}
        </section>

        <section className="mock-detail-section">
          <Mono muted>Your decision</Mono>
          <div className="mock-decision-stack">
            {(Object.keys(STATUS_META) as SelectionStatus[]).map((decision) => {
              const active = status === decision;
              const meta = STATUS_META[decision];
              return (
                <button
                  key={decision}
                  className={active ? "active" : ""}
                  style={active ? { borderColor: meta.color, background: meta.bg } : undefined}
                  onClick={() => onDecision(decision)}
                  aria-label={`Mark ${meta.label}`}
                >
                  <span>
                    <i style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="mock-kbd">{decision === "shortlist" ? "1" : decision === "maybe" ? "2" : "3"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mock-detail-section">
          <Mono muted>Memo</Mono>
          {onAddMemo && (
            <div className="mock-memo-form">
              <textarea
                id="memo-input"
                placeholder="Add buyer or internal note..."
                rows={3}
                value={memoDraft}
                onChange={(event) => setMemoDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <div className="mock-memo-form-actions">
                <Mono muted>Enter to send / Shift+Enter for newline</Mono>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!memoDraft.trim() || sending}
                  className="mock-memo-send"
                >
                  {sending ? <Loader2 size={12} className="mock-spin" /> : null}
                  Send
                </button>
              </div>
            </div>
          )}
          {memos && memos.length > 0 ? (
            <ul className="mock-memo-thread">
              {memos.map((memo) => (
                <li key={memo.id} className="mock-memo-item">
                  <div className="mock-memo-meta">
                    <b>{memo.user_name}</b>
                    <Mono muted>{formatTimeAgo(memo.created_at)}</Mono>
                  </div>
                  <p>{memo.content}</p>
                </li>
              ))}
              {hasMoreMemos && onLoadMoreMemos && (
                <li>
                  <button
                    type="button"
                    className="mock-memo-loadmore"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </li>
              )}
            </ul>
          ) : memos && memos.length === 0 ? (
            <p className="mock-empty-copy">No memos yet.</p>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
