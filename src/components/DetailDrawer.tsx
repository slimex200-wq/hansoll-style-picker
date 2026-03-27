"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Style, SelectionStatus, Memo } from "@/lib/types";
import { STATUS_CONFIG, formatTimeAgo } from "@/lib/store";
import { showToast } from "./Toast";

interface DetailDrawerProps {
  style: Style;
  currentStatus: SelectionStatus | null;
  memos: Memo[];
  hasMore?: boolean;
  onClose: () => void;
  onSelect: (styleId: string, status: SelectionStatus) => Promise<void>;
  onAddMemo: (styleId: string, content: string) => Promise<void>;
  onLoadMore?: () => Promise<void>;
  styleIndex?: number;
  totalStyles?: number;
  onNavigate?: (direction: "prev" | "next") => void;
  prevStyleId?: string;
  nextStyleId?: string;
}

const STATUSES: SelectionStatus[] = ["shortlist", "maybe", "pass"];

const STATUS_STYLES: Record<SelectionStatus, { bg: string; border: string; color: string }> = {
  shortlist: { bg: "#E8F5E9", border: "#3D8B5E", color: "#2E7D32" },
  maybe: { bg: "#FFF8E1", border: "#C4862D", color: "#F57F17" },
  pass: { bg: "#fdf0ee", border: "#C43D2D", color: "#C43D2D" },
};

export default function DetailDrawer({
  style,
  currentStatus,
  memos,
  hasMore = false,
  onClose,
  onSelect,
  onAddMemo,
  onLoadMore,
  styleIndex,
  totalStyles,
  onNavigate,
  prevStyleId,
  nextStyleId,
}: DetailDrawerProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [memoText, setMemoText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectingStatus, setSelectingStatus] = useState<SelectionStatus | null>(null);
  const [closing, setClosing] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setPhotoIndex(0); }, [style.id]);

  const photos = style.images.length > 0 ? style.images : [style.image_url];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") { handleClose(); return; }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (photoIndex > 0) setPhotoIndex((p) => p - 1);
        else if (onNavigate && prevStyleId) onNavigate("prev");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (photoIndex < photos.length - 1) setPhotoIndex((p) => p + 1);
        else if (onNavigate && nextStyleId) onNavigate("next");
      }
      if (e.key === "1") handleSelect("shortlist");
      if (e.key === "2") handleSelect("maybe");
      if (e.key === "3") handleSelect("pass");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photoIndex, photos.length, onNavigate, prevStyleId, nextStyleId]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstFocusRef.current?.focus(), 100);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 150); };

  const handleSelect = async (status: SelectionStatus) => {
    setSelectingStatus(status);
    try { await onSelect(style.id, status); } finally { setSelectingStatus(null); }
  };

  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = memoText.trim();
    if (!trimmed) { showToast("Please enter a memo", "error"); return; }
    setSaving(true);
    try { await onAddMemo(style.id, trimmed); setMemoText(""); } finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        @keyframes modal-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-overlay-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes modal-in { from { opacity: 0; transform: translateY(12px) scale(0.97) } to { opacity: 1; transform: none } }
        @keyframes modal-out { from { opacity: 1; transform: none } to { opacity: 0; transform: translateY(8px) scale(0.98) } }
        @keyframes mobile-slide-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes mobile-slide-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
        .memo-scroll::-webkit-scrollbar { width: 3px }
        .memo-scroll::-webkit-scrollbar-track { background: #E8E4E0; border-radius: 9999px }
        .memo-scroll::-webkit-scrollbar-thumb { background: #9B9590; border-radius: 9999px }
      `}</style>

      {/* Overlay */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          animation: `${closing ? "modal-overlay-out 150ms ease-in both" : "modal-overlay-in 200ms ease-out both"}`,
        }}
      />

      {/* Modal */}
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Details for style ${style.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 900,
            maxHeight: "90vh",
            boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
            overflow: "hidden",
            position: "relative",
            animation: `${closing ? "modal-out 150ms ease-in both" : "modal-in 250ms ease-out both"}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Close button */}
          <button
            ref={firstFocusRef}
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.8)", border: "none", borderRadius: 9999,
              cursor: "pointer", transition: "all 0.15s", color: "#9B9590",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FAF9F7"; e.currentTarget.style.color = "#2C2C2C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.color = "#9B9590"; }}
          >
            <X size={20} />
          </button>

          {/* ===== DESKTOP: Side-by-side (sm+) ===== */}
          <div className="hidden sm:flex" style={{ flex: 1, minHeight: 0 }}>
            {/* Left: Image */}
            <div style={{ width: "45%", flexShrink: 0, position: "relative", background: "#F0EEEB" }}>
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {photos[photoIndex] ? (
                  <Image src={photos[photoIndex]} alt={`${style.id} product image`} fill className="object-cover" sizes="320px" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{style.id}</div>
                )}
              </div>

              {/* Carousel arrows */}
              {photos.length > 1 && photoIndex > 0 && (
                <button onClick={() => setPhotoIndex((p) => p - 1)} aria-label="Previous image" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 9999, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.boxShadow = "none"; }}
                ><ChevronLeft size={16} /></button>
              )}
              {photos.length > 1 && photoIndex < photos.length - 1 && (
                <button onClick={() => setPhotoIndex((p) => p + 1)} aria-label="Next image" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 9999, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.boxShadow = "none"; }}
                ><ChevronRight size={16} /></button>
              )}

              {/* Dots */}
              {photos.length > 1 && (
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)} aria-label={`Image ${i + 1}`}
                      style={{ width: 6, height: 6, borderRadius: 9999, border: "none", padding: 0, cursor: "pointer", background: i === photoIndex ? "#C45A2D" : "rgba(232,228,224,0.7)", transition: "background 0.2s" }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info + Actions */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>
                {/* Style ID */}
                <div style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
                  {style.id}
                </div>
                {/* Spec */}
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                  {style.contents} <span style={{ margin: "0 4px" }}>&middot;</span> {style.construction} <span style={{ margin: "0 4px" }}>&middot;</span> {style.weight}
                </div>
                {style.fabric_suggestion && (
                  <div style={{ marginTop: 8, background: "var(--accent-light)", borderRadius: 8, padding: "6px 12px", fontSize: 11, display: "inline-block" }}>
                    <strong style={{ color: "var(--accent)" }}>Suggestion</strong> {style.fabric_suggestion.fabric_no}
                  </div>
                )}

                {/* Selection buttons */}
                <div role="radiogroup" aria-label="Style selection" style={{ marginTop: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {STATUSES.map((s) => {
                      const isActive = currentStatus === s;
                      const isLoading = selectingStatus === s;
                      const c = STATUS_STYLES[s];
                      return (
                        <button key={s} role="radio" aria-checked={isActive} onClick={() => handleSelect(s)} disabled={isLoading}
                          style={{
                            minHeight: 44, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                            border: `1px solid ${isActive ? c.border : "var(--border)"}`, borderRadius: 4,
                            background: isActive ? c.bg : "transparent", color: isActive ? c.color : "var(--text-primary)",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#FAF9F7"; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                          {isLoading ? "..." : STATUS_CONFIG[s].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Memos */}
                <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
                    MEMOS
                  </div>
                  {memos.length === 0 ? (
                    <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-muted)" }}>No memos yet.</p>
                  ) : (
                    <div className="memo-scroll" style={{ maxHeight: memos.length > 3 ? 140 : "none", overflowY: memos.length > 3 ? "auto" : "visible" }}>
                      {memos.map((memo, i) => (
                        <div key={memo.id} style={{ padding: "6px 0", borderBottom: i < memos.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{memo.user_name}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{formatTimeAgo(memo.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{memo.content}</div>
                        </div>
                      ))}
                      {hasMore && onLoadMore && (
                        <button onClick={async () => { setLoadingMore(true); try { await onLoadMore(); } finally { setLoadingMore(false); } }} disabled={loadingMore}
                          style={{ fontSize: 12, color: "var(--accent)", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}
                        >{loadingMore ? "Loading..." : "Load earlier memos"}</button>
                      )}
                    </div>
                  )}

                  {/* Memo input */}
                  <form onSubmit={handleAddMemo} style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 8 }}>
                    <input type="text" value={memoText} onChange={(e) => setMemoText(e.target.value)}
                      placeholder="Add a memo..." aria-label={`Add a memo for style ${style.id}`}
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)", background: "transparent", outline: "none", minHeight: 40, transition: "border-color 0.15s" }}
                      onFocus={(e) => (e.target.style.borderColor = "#C45A2D")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                    <button type="submit" disabled={saving || !memoText.trim()}
                      style={{ minWidth: 64, minHeight: 40, background: "#C45A2D", color: "white", borderRadius: 4, border: "none", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving || !memoText.trim() ? "default" : "pointer", opacity: saving || !memoText.trim() ? 0.5 : 1, pointerEvents: saving || !memoText.trim() ? "none" as const : "auto" as const, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { if (memoText.trim()) e.currentTarget.style.background = "#A84B24"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#C45A2D"; }}
                    >{saving ? "..." : "Send"}</button>
                  </form>
                </div>

                <div style={{ height: 16 }} />
              </div>

              {/* Prev/Next nav */}
              {onNavigate && (
                <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                  {prevStyleId ? (
                    <button onClick={() => onNavigate("prev")} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >← {prevStyleId}</button>
                  ) : <span />}
                  {styleIndex !== undefined && totalStyles !== undefined && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {styleIndex + 1} / {totalStyles}
                    </span>
                  )}
                  {nextStyleId ? (
                    <button onClick={() => onNavigate("next")} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >{nextStyleId} →</button>
                  ) : <span />}
                </div>
              )}
            </div>
          </div>

          {/* ===== MOBILE: Stacked (< sm) ===== */}
          <div className="sm:hidden" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}>
              <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 9999 }} />
            </div>

            {/* Image */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#F0EEEB", flexShrink: 0 }}>
              {photos[photoIndex] ? (
                <Image src={photos[photoIndex]} alt={`${style.id} product image`} fill className="object-cover" sizes="100vw" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{style.id}</div>
              )}
              {photos.length > 1 && photoIndex > 0 && (
                <button onClick={() => setPhotoIndex((p) => p - 1)} aria-label="Previous image" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C" }}>
                  <ChevronLeft size={16} />
                </button>
              )}
              {photos.length > 1 && photoIndex < photos.length - 1 && (
                <button onClick={() => setPhotoIndex((p) => p + 1)} aria-label="Next image" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C" }}>
                  <ChevronRight size={16} />
                </button>
              )}
              {photos.length > 1 && (
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)} aria-label={`Image ${i + 1}`}
                      style={{ width: 6, height: 6, borderRadius: 9999, border: "none", padding: 0, cursor: "pointer", background: i === photoIndex ? "#C45A2D" : "rgba(232,228,224,0.7)", transition: "background 0.2s" }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info + Actions (mobile) */}
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>{style.id}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                {style.contents} <span style={{ margin: "0 4px" }}>&middot;</span> {style.construction} <span style={{ margin: "0 4px" }}>&middot;</span> {style.weight}
              </div>
              {style.fabric_suggestion && (
                <div style={{ marginTop: 8, background: "var(--accent-light)", borderRadius: 8, padding: "6px 12px", fontSize: 11, display: "inline-block" }}>
                  <strong style={{ color: "var(--accent)" }}>Suggestion</strong> {style.fabric_suggestion.fabric_no}
                </div>
              )}

              <div role="radiogroup" aria-label="Style selection" style={{ marginTop: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {STATUSES.map((s) => {
                    const isActive = currentStatus === s;
                    const isLoading = selectingStatus === s;
                    const c = STATUS_STYLES[s];
                    return (
                      <button key={s} role="radio" aria-checked={isActive} onClick={() => handleSelect(s)} disabled={isLoading}
                        style={{ minHeight: 48, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, border: `1px solid ${isActive ? c.border : "var(--border)"}`, borderRadius: 4, background: isActive ? c.bg : "transparent", color: isActive ? c.color : "var(--text-primary)", cursor: "pointer", transition: "all 0.15s" }}
                      >{isLoading ? "..." : STATUS_CONFIG[s].label}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>MEMOS</div>
                {memos.length === 0 ? (
                  <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-muted)" }}>No memos yet.</p>
                ) : (
                  <div className="memo-scroll" style={{ maxHeight: memos.length > 3 ? 160 : "none", overflowY: memos.length > 3 ? "auto" : "visible" }}>
                    {memos.map((memo, i) => (
                      <div key={memo.id} style={{ padding: "6px 0", borderBottom: i < memos.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{memo.user_name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{formatTimeAgo(memo.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{memo.content}</div>
                      </div>
                    ))}
                    {hasMore && onLoadMore && (
                      <button onClick={async () => { setLoadingMore(true); try { await onLoadMore(); } finally { setLoadingMore(false); } }} disabled={loadingMore}
                        style={{ fontSize: 12, color: "var(--accent)", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}
                      >{loadingMore ? "Loading..." : "Load earlier memos"}</button>
                    )}
                  </div>
                )}
                <form onSubmit={handleAddMemo} style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 8 }}>
                  <input type="text" value={memoText} onChange={(e) => setMemoText(e.target.value)}
                    placeholder="Add a memo..." aria-label={`Add a memo for style ${style.id}`}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)", background: "transparent", outline: "none", minHeight: 40, transition: "border-color 0.15s" }}
                    onFocus={(e) => (e.target.style.borderColor = "#C45A2D")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button type="submit" disabled={saving || !memoText.trim()}
                    style={{ minWidth: 64, minHeight: 40, background: "#C45A2D", color: "white", borderRadius: 4, border: "none", fontSize: 13, fontWeight: 600, cursor: saving || !memoText.trim() ? "default" : "pointer", opacity: saving || !memoText.trim() ? 0.5 : 1, pointerEvents: saving || !memoText.trim() ? "none" as const : "auto" as const, transition: "all 0.15s" }}
                  >{saving ? "..." : "Send"}</button>
                </form>
              </div>
              <div style={{ height: 16 }} />
            </div>

            {/* Prev/Next (mobile) */}
            {onNavigate && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                {prevStyleId ? (
                  <button onClick={() => onNavigate("prev")} style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>← {prevStyleId}</button>
                ) : <span />}
                {styleIndex !== undefined && totalStyles !== undefined && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{styleIndex + 1} / {totalStyles}</span>
                )}
                {nextStyleId ? (
                  <button onClick={() => onNavigate("next")} style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>{nextStyleId} →</button>
                ) : <span />}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
