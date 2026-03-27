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
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/30 z-50"
        style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center popup modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for style ${style.id}`}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col shadow-xl animate-pop-in"
          style={{ padding: "20px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="self-end text-[#9B9590] hover:text-[#2C2C2C] transition-colors mb-2 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>

          {/* Photo - large */}
          <div className="relative w-full aspect-[4/3] bg-[#F0EEEB] rounded-xl overflow-hidden mb-4 shrink-0">
            {photos[photoIndex] ? (
              <Image
                src={photos[photoIndex]}
                alt={`${style.id} photo ${photoIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 600px) 100vw, 600px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9B9590]">
                {style.id}
              </div>
            )}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === photoIndex ? "bg-white shadow" : "bg-white/50"
                    }`}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info row: title + specs inline */}
          <div className="flex items-start justify-between gap-4 mb-3 shrink-0">
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif" }} className="text-xl font-normal text-[#2C2C2C]">{style.id}</h2>
              <div className="text-[12px] text-[#9B9590] mt-0.5">
                {style.contents} · {style.construction} · {style.weight}
              </div>
            </div>
            {style.fabric_suggestion && (
              <div className="bg-[#FFF6F1] rounded-lg px-3 py-1.5 text-[11px] shrink-0">
                <strong className="text-[#C45A2D]">Suggestion</strong>{" "}
                {style.fabric_suggestion.fabric_no}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3 shrink-0">
            {(["shortlist", "maybe", "pass"] as SelectionStatus[]).map((s) => {
              const config = STATUS_CONFIG[s];
              const isActive = currentStatus === s;
              const isLoading = selectingStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all min-h-[40px] ${
                    isActive
                      ? `${config.border} ${config.activeBg}`
                      : "border-[#E8E4E0] bg-white text-[#2C2C2C] hover:border-[#ccc]"
                  }`}
                >
                  {isLoading ? "..." : config.label}
                </button>
              );
            })}
          </div>

          {/* Memo section - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1.5">Memos</h3>

            {memos.length === 0 ? (
              <p className="text-[12px] text-[#9B9590] mb-2">No memos yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5 mb-2">
                {memos.map((memo) => (
                  <div key={memo.id} className="bg-[#f8f8f8] rounded-lg p-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-[#C45A2D]">{memo.user_name}</span>
                      <span className="text-[10px] text-[#9B9590]">{formatTimeAgo(memo.created_at)}</span>
                    </div>
                    <div className="text-[12px] text-[#2C2C2C] mt-0.5">{memo.content}</div>
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
                    className="text-[12px] text-[#C45A2D] hover:text-[#A84B24] py-1.5 transition-colors disabled:opacity-40"
                  >
                    {loadingMore ? "Loading..." : "Load earlier memos"}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAddMemo} className="flex gap-2 items-end">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="Add a memo..."
                aria-label={`Add a memo for style ${style.id}`}
                rows={1}
                className="flex-1 px-3 py-2 border border-[#E8E4E0] rounded-lg text-sm resize-none text-[#2C2C2C] placeholder:text-[#9B9590] focus:outline-none focus:border-[#C45A2D] transition-colors"
              />
              <button
                type="submit"
                disabled={saving || !memoText.trim()}
                className="px-4 py-2 bg-[#C45A2D] text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-[#A84B24] transition-colors min-h-[38px] shrink-0"
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
