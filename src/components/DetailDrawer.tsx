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
  style, currentStatus, memos, hasMore = false,
  onClose, onSelect, onAddMemo, onLoadMore,
  styleIndex, totalStyles, onNavigate, prevStyleId, nextStyleId,
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { handleClose(); return; }
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (photoIndex > 0) setPhotoIndex(p => p - 1);
      else if (onNavigate && prevStyleId) onNavigate("prev");
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (photoIndex < photos.length - 1) setPhotoIndex(p => p + 1);
      else if (onNavigate && nextStyleId) onNavigate("next");
    }
    if (e.key === "1") handleSelect("shortlist");
    if (e.key === "2") handleSelect("maybe");
    if (e.key === "3") handleSelect("pass");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoIndex, photos.length, onNavigate, prevStyleId, nextStyleId]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstFocusRef.current?.focus(), 100);
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
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

  const sidebarContent = (padding: string) => (
    <>
      {/* Style info */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: 6 }}>
          {style.id}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums", lineHeight: 1.6 }}>
          {style.contents}<br />
          {style.construction} &middot; {style.weight}
        </div>
        {style.fabric_suggestion && (
          <div style={{ marginTop: 10, background: "var(--accent-light)", borderRadius: 8, padding: "6px 12px", fontSize: 11, display: "inline-block" }}>
            <strong style={{ color: "var(--accent)" }}>Suggestion</strong> {style.fabric_suggestion.fabric_no}
          </div>
        )}
      </div>

      {/* Selection buttons */}
      <div role="radiogroup" aria-label="Style selection" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {STATUSES.map(s => {
            const isActive = currentStatus === s;
            const isLoading = selectingStatus === s;
            const c = STATUS_STYLES[s];
            return (
              <button key={s} role="radio" aria-checked={isActive} onClick={() => handleSelect(s)} disabled={isLoading}
                style={{
                  minHeight: 44, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                  border: `1px solid ${isActive ? c.border : "var(--border)"}`, borderRadius: 4,
                  background: isActive ? c.bg : "var(--surface)", color: isActive ? c.color : "var(--text-primary)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "var(--surface)"; }}
              >{isLoading ? "..." : STATUS_CONFIG[s].label}</button>
            );
          })}
        </div>
      </div>

      {/* Memos */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>MEMOS</div>
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
        <form onSubmit={handleAddMemo} style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 8 }}>
          <input type="text" value={memoText} onChange={e => setMemoText(e.target.value)}
            placeholder="Add a memo..." aria-label={`Add a memo for style ${style.id}`}
            style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)", background: "var(--surface)", outline: "none", minHeight: 40, transition: "border-color 0.15s" }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button type="submit" disabled={saving || !memoText.trim()}
            style={{ minWidth: 64, minHeight: 40, background: "var(--accent)", color: "white", borderRadius: 4, border: "none", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: saving || !memoText.trim() ? "default" : "pointer", opacity: saving || !memoText.trim() ? 0.5 : 1, pointerEvents: saving || !memoText.trim() ? "none" as const : "auto" as const, transition: "all 0.15s" }}
            onMouseEnter={e => { if (memoText.trim()) e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
          >{saving ? "..." : "Send"}</button>
        </form>
      </div>
    </>
  );

  const navBar = (
    onNavigate ? (
      <div style={{ padding: "12px 0 0", borderTop: "1px solid var(--border)", marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {prevStyleId ? (
          <button onClick={() => onNavigate("prev")} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >← {prevStyleId}</button>
        ) : <span />}
        {styleIndex !== undefined && totalStyles !== undefined && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{styleIndex + 1} / {totalStyles}</span>
        )}
        {nextStyleId ? (
          <button onClick={() => onNavigate("next")} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >{nextStyleId} →</button>
        ) : <span />}
      </div>
    ) : null
  );

  const imageArea = (aspectRatio: string, sizes: string) => (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#F0EEEB" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio, height: aspectRatio ? "auto" : "100%" }}>
        {photos[photoIndex] ? (
          <Image src={photos[photoIndex]} alt={`${style.id} product image`} fill className="object-contain" sizes={sizes} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{style.id}</div>
        )}
      </div>
      {photos.length > 1 && photoIndex > 0 && (
        <button onClick={() => setPhotoIndex(p => p - 1)} aria-label="Previous image"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.boxShadow = "none"; }}
        ><ChevronLeft size={16} /></button>
      )}
      {photos.length > 1 && photoIndex < photos.length - 1 && (
        <button onClick={() => setPhotoIndex(p => p + 1)} aria-label="Next image"
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C2C2C", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.boxShadow = "none"; }}
        ><ChevronRight size={16} /></button>
      )}
      {photos.length > 1 && (
        <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {photos.map((_, i) => (
            <button key={i} onClick={() => setPhotoIndex(i)} aria-label={`Image ${i + 1}`}
              style={{ width: 6, height: 6, borderRadius: 9999, border: "none", padding: 0, cursor: "pointer", background: i === photoIndex ? "var(--accent)" : "rgba(232,228,224,0.7)", transition: "background 0.2s" }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes modal-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-overlay-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: none } }
        @keyframes modal-out { from { opacity: 1; transform: none } to { opacity: 0; transform: scale(0.98) } }
        @keyframes mobile-slide-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes mobile-slide-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
        .memo-scroll::-webkit-scrollbar { width: 3px }
        .memo-scroll::-webkit-scrollbar-track { background: var(--border); border-radius: 9999px }
        .memo-scroll::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 9999px }
        .modal-desktop { display: none }
        .modal-mobile { display: flex; flex-direction: column; flex: 1; overflow-y: auto }
        @media (min-width: 640px) {
          .modal-desktop { display: flex }
          .modal-mobile { display: none }
        }
      `}</style>

      {/* Overlay — fullscreen dark */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.85)",
          animation: `${closing ? "modal-overlay-out 150ms ease-in both" : "modal-overlay-in 200ms ease-out both"}`,
        }}
      />

      {/* ===== DESKTOP: fullscreen with sidebar ===== */}
      <div className="modal-desktop"
        role="dialog" aria-modal="true" aria-label={`Details for style ${style.id}`}
        style={{
          position: "fixed", inset: 0, zIndex: 60,
          animation: `${closing ? "modal-out 150ms ease-in both" : "modal-in 250ms ease-out both"}`,
        }}
      >
        {/* Close */}
        <button ref={firstFocusRef} onClick={handleClose} aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 9999, cursor: "pointer", color: "rgba(255,255,255,0.6)", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        ><X size={20} /></button>

        {/* Image area — fills remaining space */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, minWidth: 0 }}
          onClick={handleClose}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", height: "100%", maxWidth: 600 }}>
            {photos[photoIndex] ? (
              <Image src={photos[photoIndex]} alt={`${style.id} product image`} fill className="object-contain" sizes="60vw" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 20 }}>{style.id}</div>
            )}
            {/* Arrows */}
            {photos.length > 1 && photoIndex > 0 && (
              <button onClick={() => setPhotoIndex(p => p - 1)} aria-label="Previous image"
                style={{ position: "absolute", left: -48, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 9999, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              ><ChevronLeft size={20} /></button>
            )}
            {photos.length > 1 && photoIndex < photos.length - 1 && (
              <button onClick={() => setPhotoIndex(p => p + 1)} aria-label="Next image"
                style={{ position: "absolute", right: -48, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 9999, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              ><ChevronRight size={20} /></button>
            )}
            {/* Dots */}
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIndex(i)} aria-label={`Image ${i + 1}`}
                    style={{ width: 8, height: 8, borderRadius: 9999, border: "none", padding: 0, cursor: "pointer", background: i === photoIndex ? "var(--accent)" : "rgba(255,255,255,0.3)", transition: "background 0.2s" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div onClick={e => e.stopPropagation()}
          style={{
            width: 340, flexShrink: 0,
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
            {sidebarContent("24px")}
            {navBar}
          </div>
        </div>
      </div>

      {/* ===== MOBILE: bottom sheet ===== */}
      <div className="modal-mobile"
        role="dialog" aria-modal="true" aria-label={`Details for style ${style.id}`}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          background: "var(--surface)",
          borderRadius: "12px 12px 0 0",
          maxHeight: "92vh",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          animation: `${closing ? "mobile-slide-out 150ms ease-in both" : "mobile-slide-in 250ms ease-out both"}`,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 9999 }} />
        </div>

        {/* Close */}
        <button onClick={handleClose} aria-label="Close"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 9999, cursor: "pointer", color: "var(--text-muted)" }}
        ><X size={20} /></button>

        {/* Image */}
        <div style={{ flexShrink: 0 }}>
          {imageArea("1/1", "100vw")}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {sidebarContent("20px")}
          {navBar}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  );
}
