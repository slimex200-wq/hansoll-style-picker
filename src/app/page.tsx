"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Memo, Selection, SelectionStatus, Style } from "@/lib/types";
import { fetchMemos, fetchMemosByStyle, fetchSelections, fetchStyles, insertMemo, upsertSelection } from "@/lib/api";
import { getUserId, getUserName, setUserName } from "@/lib/store";
import NamePrompt from "@/components/NamePrompt";
import ToastContainer, { showToast } from "@/components/Toast";
import HandoffStyles from "@/components/handoff/HandoffStyles";
import Sidebar from "@/components/handoff/Sidebar";
import TopBar from "@/components/handoff/TopBar";
import ListView from "@/components/handoff/ListView";
import GalleryView from "@/components/handoff/GalleryView";
import DetailPanel from "@/components/handoff/DetailPanel";
import SummaryModal from "@/components/handoff/SummaryModal";
import {
  PALETTE,
  getCollectionLabel,
  getFabricRows,
} from "@/components/handoff/palette";
import type { FilterKey, ViewMode } from "@/components/handoff/palette";

interface MemoBucket {
  memos: Memo[];
  hasMore: boolean;
  offset: number;
}

const KEY_TO_STATUS: Record<string, SelectionStatus> = {
  "1": "shortlist",
  "2": "maybe",
  "3": "pass",
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [styles, setStyles] = useState<Style[]>([]);
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [styleMemos, setStyleMemos] = useState<Map<string, MemoBucket>>(new Map());

  const [activeDivision, setActiveDivision] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [stylesData, selectionsData, memosData] = await Promise.all([
        fetchStyles(),
        fetchSelections(),
        fetchMemos(),
      ]);
      setStyles(stylesData);
      const selMap = new Map<string, Selection>();
      for (const s of selectionsData) selMap.set(`${s.style_id}:${s.user_id}`, s);
      setSelections(selMap);

      const memoMap = new Map<string, MemoBucket>();
      for (const memo of memosData) {
        const existing = memoMap.get(memo.style_id);
        memoMap.set(memo.style_id, {
          memos: existing ? [...existing.memos, memo] : [memo],
          hasMore: false,
          offset: 0,
        });
      }
      setStyleMemos(memoMap);
      setSelectedId((current) => current ?? stylesData[0]?.id ?? null);
    } catch (e) {
      setLoadError((e as Error).message);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setUserId(getUserId());
    setUserNameState(getUserName());
    loadData();
  }, [loadData]);

  const handleNameSubmit = useCallback((name: string) => {
    setUserName(name);
    setUserNameState(name);
    setUserId(getUserId());
  }, []);

  const getSelectionKey = useCallback(
    (styleId: string) => `${styleId}:${userId}`,
    [userId]
  );

  const getStatusForStyle = useCallback(
    (styleId: string): SelectionStatus | null => {
      if (!userId) return null;
      return selections.get(getSelectionKey(styleId))?.status ?? null;
    },
    [getSelectionKey, selections, userId]
  );

  const handleSelect = useCallback(
    async (styleId: string, status: SelectionStatus) => {
      if (!userId || !userName) return;
      const style = styles.find((s) => s.id === styleId);
      if (!style) return;
      const key = `${styleId}:${userId}`;
      const prev = selections.get(key);
      // Toggle off click on the same status is a no-op (DB has no nullable status).
      if (prev?.status === status) return;

      try {
        setSelections((map) => {
          const next = new Map(map);
          next.set(key, {
            id: prev?.id ?? "",
            style_id: styleId,
            collection: style.collection,
            user_id: userId,
            user_name: userName,
            status,
            created_at: prev?.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return next;
        });
        const saved = await upsertSelection(styleId, style.collection, userId, userName, status);
        setSelections((map) => {
          const next = new Map(map);
          next.set(key, saved);
          return next;
        });
        showToast("Selection saved", "success");
      } catch {
        setSelections((map) => {
          const next = new Map(map);
          if (prev) next.set(key, prev);
          else next.delete(key);
          return next;
        });
        showToast("Failed to save selection", "error");
      }
    },
    [selections, styles, userId, userName]
  );

  const handleAddMemo = useCallback(
    async (styleId: string, content: string) => {
      if (!userId || !userName) return;
      const style = styles.find((s) => s.id === styleId);
      if (!style) return;
      try {
        const saved = await insertMemo(styleId, style.collection, userId, userName, content);
        setStyleMemos((prev) => {
          const next = new Map(prev);
          const existing = prev.get(styleId);
          next.set(styleId, {
            memos: [saved, ...(existing?.memos ?? [])],
            hasMore: existing?.hasMore ?? false,
            offset: existing?.offset ?? 0,
          });
          return next;
        });
        showToast("Memo added", "success");
      } catch {
        showToast("Failed to save memo", "error");
      }
    },
    [styles, userId, userName]
  );

  const handleLoadMoreMemos = useCallback(
    async (styleId: string) => {
      const current = styleMemos.get(styleId);
      const newOffset = (current?.offset ?? 0) + 20;
      try {
        const result = await fetchMemosByStyle(styleId, 20, newOffset);
        setStyleMemos((prev) => {
          const next = new Map(prev);
          const existing = prev.get(styleId);
          next.set(styleId, {
            memos: [...(existing?.memos ?? []), ...result.data],
            hasMore: result.hasMore,
            offset: newOffset,
          });
          return next;
        });
      } catch {
        showToast("Failed to load more memos", "error");
      }
    },
    [styleMemos]
  );

  const divisions = useMemo(
    () => [...new Set(styles.map((style) => style.division || "Unassigned"))],
    [styles]
  );
  const currentDivision = activeDivision && divisions.includes(activeDivision) ? activeDivision : divisions[0] ?? "";

  const visibleStyles = useMemo(() => {
    return styles
      .filter((style) => (currentDivision ? (style.division || "Unassigned") === currentDivision : true))
      .filter((style) => {
        const status = getStatusForStyle(style.id);
        if (filter === "unreviewed") return !status;
        if (filter !== "all") return status === filter;
        return true;
      })
      .filter((style) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return [
          style.id,
          style.division,
          style.contents,
          style.construction,
          style.fabric_no,
          style.fabric_suggestion?.fabric_no,
          ...getFabricRows(style).flatMap((detail) => [
            detail.fabricCode,
            detail.supplier,
            detail.construction,
            detail.content,
          ]),
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q));
      });
  }, [currentDivision, filter, getStatusForStyle, search, styles]);

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = {
      all: styles.length,
      unreviewed: 0,
      shortlist: 0,
      maybe: 0,
      pass: 0,
    };
    for (const style of styles) {
      const status = getStatusForStyle(style.id);
      if (!status) result.unreviewed += 1;
      else result[status] += 1;
    }
    return result;
  }, [getStatusForStyle, styles]);

  const selectedStyle = useMemo(() => {
    return (
      visibleStyles.find((style) => style.id === selectedId) ??
      visibleStyles[0] ??
      styles[0] ??
      null
    );
  }, [selectedId, styles, visibleStyles]);

  const selectedIndex = selectedStyle ? visibleStyles.findIndex((style) => style.id === selectedStyle.id) : -1;
  const selectedStatus = selectedStyle ? getStatusForStyle(selectedStyle.id) : null;
  const reviewedPct = counts.all > 0 ? Math.round(((counts.all - counts.unreviewed) / counts.all) * 100) : 0;
  const collectionLabel = useMemo(() => getCollectionLabel(styles), [styles]);
  const collectionStats = useMemo(() => {
    if (styles.length === 0) return undefined;
    return {
      styleCount: styles.length,
      divisionCount: divisions.length,
      collectionLabel,
    };
  }, [collectionLabel, divisions.length, styles.length]);

  const moveSelection = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedStyle || visibleStyles.length === 0) return;
      const currentIndex = Math.max(0, visibleStyles.findIndex((style) => style.id === selectedStyle.id));
      const nextIndex =
        direction === "prev"
          ? (currentIndex - 1 + visibleStyles.length) % visibleStyles.length
          : (currentIndex + 1) % visibleStyles.length;
      setSelectedId(visibleStyles[nextIndex].id);
    },
    [selectedStyle, visibleStyles]
  );

  // Keyboard shortcuts: 1/2/3 -> Pick/Hold/Skip on the focused style.
  useEffect(() => {
    if (!selectedStyle || !userId || !userName) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = document.activeElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target as HTMLElement).isContentEditable)) {
        return;
      }
      const status = KEY_TO_STATUS[event.key];
      if (!status) return;
      event.preventDefault();
      if (selectedStyle) {
        void handleSelect(selectedStyle.id, status);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSelect, selectedStyle, userId, userName]);

  const avatarInitials = useMemo(() => {
    if (!userName) return "HS";
    const trimmed = userName.trim();
    if (!trimmed) return "HS";
    return trimmed.slice(0, 2).toUpperCase();
  }, [userName]);

  // Pre-render checks (kept outside the shell so SSR/hydration is stable).
  if (!mounted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: PALETTE.bg }}>
        <p style={{ color: PALETTE.inkLight, fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!userName) {
    return (
      <>
        <NamePrompt onSubmit={handleNameSubmit} stats={collectionStats} />
        <ToastContainer />
      </>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: PALETTE.bg }}>
        <p style={{ color: PALETTE.inkLight, fontSize: 14 }}>Loading collection...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <>
        <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, background: PALETTE.panel, border: `1px solid ${PALETTE.rule}`, borderRadius: 8, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: PALETTE.ink, marginBottom: 6 }}>
              Collection unavailable
            </div>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>
              {loadError}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={loadData}
                style={{ minHeight: 40, padding: "0 14px", background: PALETTE.peach, color: "white", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Retry
              </button>
              <a
                href="/admin/upload"
                style={{ minHeight: 40, padding: "0 14px", display: "inline-flex", alignItems: "center", border: `1px solid ${PALETTE.rule}`, borderRadius: 4, color: PALETTE.ink, textDecoration: "none", fontSize: 13 }}
              >
                Upload Data
              </a>
            </div>
          </div>
        </div>
        <ToastContainer />
      </>
    );
  }

  const selectedMemos = selectedStyle ? styleMemos.get(selectedStyle.id)?.memos ?? [] : [];
  const selectedHasMore = selectedStyle ? styleMemos.get(selectedStyle.id)?.hasMore ?? false : false;

  return (
    <>
      <HandoffStyles />

      <div className="mock-page">
        <div className="mock-shell">
          <TopBar
            search={search}
            setSearch={setSearch}
            view={view}
            setView={setView}
            total={styles.length}
            avatarInitials={avatarInitials}
          />
          <div className="mock-body">
            <Sidebar
              divisions={divisions}
              activeDivision={currentDivision}
              setActiveDivision={(division) => {
                setActiveDivision(division);
                setFilter("all");
              }}
              counts={counts}
              reviewedPct={reviewedPct}
              filter={filter}
              setFilter={setFilter}
              collectionLabel={collectionLabel}
              onSummary={() => setShowSummary(true)}
            />

            <main className="mock-content">
              <div className="mock-content-header">
                <div>
                  <h1>{currentDivision || "Collection"}</h1>
                  <p>
                    {visibleStyles.length} shown from {styles.length} styles &middot; {counts.all - counts.unreviewed}/{counts.all} reviewed
                  </p>
                </div>
                <div className="mock-review-note">
                  Press 1/2/3 to mark Pick / Hold / Skip on the selected style.
                </div>
              </div>

              {visibleStyles.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center", color: PALETTE.inkLight }}>
                  No styles match this view.
                </div>
              ) : view === "list" ? (
                <ListView
                  styles={visibleStyles}
                  getStatus={(style) => getStatusForStyle(style.id)}
                  selectedId={selectedStyle?.id ?? null}
                  onSelectStyle={setSelectedId}
                  onDecision={(style, status) => void handleSelect(style.id, status)}
                />
              ) : (
                <GalleryView
                  styles={visibleStyles}
                  getStatus={(style) => getStatusForStyle(style.id)}
                  selectedId={selectedStyle?.id ?? null}
                  onSelectStyle={setSelectedId}
                  onDecision={(style, status) => void handleSelect(style.id, status)}
                />
              )}
            </main>

            {selectedStyle && (
              <DetailPanel
                style={selectedStyle}
                status={selectedStatus}
                onDecision={(decision) => void handleSelect(selectedStyle.id, decision)}
                onPrev={() => moveSelection("prev")}
                onNext={() => moveSelection("next")}
                index={Math.max(selectedIndex, 0)}
                total={Math.max(visibleStyles.length, 1)}
                memos={selectedMemos}
                hasMoreMemos={selectedHasMore}
                onAddMemo={(content) => handleAddMemo(selectedStyle.id, content)}
                onLoadMoreMemos={() => handleLoadMoreMemos(selectedStyle.id)}
              />
            )}
          </div>
        </div>
      </div>
      {showSummary && (
        <SummaryModal
          styles={styles}
          collectionLabel={collectionLabel}
          getStatus={(style) => getStatusForStyle(style.id)}
          onClose={() => setShowSummary(false)}
        />
      )}
      <ToastContainer />
    </>
  );
}
