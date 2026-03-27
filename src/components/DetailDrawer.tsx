"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
}

export default function DetailDrawer({
  style,
  currentStatus,
  memos,
  hasMore = false,
  onClose,
  onSelect,
  onAddMemo,
  onLoadMore,
}: DetailDrawerProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [memoText, setMemoText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectingStatus, setSelectingStatus] = useState<SelectionStatus | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleSelect = async (status: SelectionStatus) => {
    setSelectingStatus(status);
    try {
      await onSelect(style.id, status);
    } finally {
      setSelectingStatus(null);
    }
  };

  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = memoText.trim();
    if (!trimmed) {
      showToast("Please enter a memo", "error");
      return;
    }
    setSaving(true);
    try {
      await onAddMemo(style.id, trimmed);
      setMemoText("");
    } finally {
      setSaving(false);
    }
  };

  const photos = style.images.length > 0 ? style.images : [style.image_url];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for style ${style.id}`}
        style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        onClick={onClose}
      >
        <div
          className="animate-pop-in"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: 600,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            padding: 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{ alignSelf: "flex-end", color: "var(--text-muted)", fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer", marginBottom: 8 }}
            aria-label="Close"
          >
            &times;
          </button>

          {/* Photo */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#F0EEEB", borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: 16, flexShrink: 0 }}>
            {photos[photoIndex] ? (
              <Image
                src={photos[photoIndex]}
                alt={`${style.id} photo ${photoIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 600px) 100vw, 600px"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                {style.id}
              </div>
            )}
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    style={{
                      width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                      background: i === photoIndex ? "white" : "rgba(255,255,255,0.5)",
                      boxShadow: i === photoIndex ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                    }}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12, flexShrink: 0 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--text-primary)" }}>{style.id}</h2>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {style.contents} &middot; {style.construction} &middot; {style.weight}
              </div>
            </div>
            {style.fabric_suggestion && (
              <div style={{ background: "var(--accent-light)", borderRadius: "var(--radius-md)", padding: "6px 12px", fontSize: 11, flexShrink: 0 }}>
                <strong style={{ color: "var(--accent)" }}>Suggestion</strong>{" "}
                {style.fabric_suggestion.fabric_no}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexShrink: 0 }}>
            {(["shortlist", "maybe", "pass"] as SelectionStatus[]).map((s) => {
              const config = STATUS_CONFIG[s];
              const isActive = currentStatus === s;
              const isLoading = selectingStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 rounded text-sm font-semibold transition-all min-h-[40px] ${
                    isActive
                      ? `border-2 ${config.border} ${config.activeBg}`
                      : "border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--text-muted)]"
                  }`}
                  style={{ borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
                >
                  {isLoading ? "..." : config.label}
                </button>
              );
            })}
          </div>

          {/* Memos */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Memos</h3>

            {memos.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>No memos yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                {memos.map((memo) => (
                  <div key={memo.id} style={{ background: "var(--bg)", borderRadius: "var(--radius-md)", padding: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{memo.user_name}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatTimeAgo(memo.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{memo.content}</div>
                  </div>
                ))}
                {hasMore && onLoadMore && (
                  <button
                    onClick={async () => {
                      setLoadingMore(true);
                      try {
                        await onLoadMore();
                      } finally {
                        setLoadingMore(false);
                      }
                    }}
                    disabled={loadingMore}
                    style={{ fontSize: 12, color: "var(--accent)", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {loadingMore ? "Loading..." : "Load earlier memos"}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAddMemo} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="Add a memo..."
                aria-label={`Add a memo for style ${style.id}`}
                rows={1}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  resize: "none",
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="submit"
                disabled={saving || !memoText.trim()}
                style={{
                  padding: "8px 16px",
                  background: saving || !memoText.trim() ? "var(--accent)" : "var(--accent)",
                  opacity: saving || !memoText.trim() ? 0.4 : 1,
                  color: "white",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "none",
                  cursor: saving || !memoText.trim() ? "default" : "pointer",
                  minHeight: 38,
                  flexShrink: 0,
                }}
              >
                {saving ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
