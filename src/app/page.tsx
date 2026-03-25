"use client";

import { useState, useEffect, useCallback } from "react";
import type { Style, SelectionStatus, Selection, Memo } from "@/lib/types";
import { getUserId, getUserName, setUserName } from "@/lib/store";
import { fetchStyles, fetchSelections, fetchMemosByStyle, upsertSelection, insertMemo } from "@/lib/api";
import StyleCard from "@/components/StyleCard";
import DetailDrawer from "@/components/DetailDrawer";
import NamePrompt from "@/components/NamePrompt";
import ToastContainer, { showToast } from "@/components/Toast";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [styleMemos, setStyleMemos] = useState<Map<string, { memos: Memo[]; hasMore: boolean; offset: number }>>(new Map());
  const [memoCounts, setMemoCounts] = useState<Map<string, number>>(new Map());

  const loadData = useCallback(async () => {
    try {
      const [stylesData, selectionsData] = await Promise.all([
        fetchStyles(),
        fetchSelections(),
      ]);
      setStyles(stylesData);
      const selMap = new Map<string, Selection>();
      for (const s of selectionsData) {
        selMap.set(`${s.style_id}:${s.user_id}`, s);
      }
      setSelections(selMap);

      // Load initial memos for each style (first page)
      const memoResults = await Promise.all(
        stylesData.map((s) => fetchMemosByStyle(s.id, 20, 0))
      );
      const memoMap = new Map<string, { memos: Memo[]; hasMore: boolean; offset: number }>();
      const countMap = new Map<string, number>();
      stylesData.forEach((s, i) => {
        memoMap.set(s.id, {
          memos: memoResults[i].data,
          hasMore: memoResults[i].hasMore,
          offset: 0,
        });
        countMap.set(s.id, memoResults[i].data.length + (memoResults[i].hasMore ? 1 : 0));
      });
      setStyleMemos(memoMap);
      setMemoCounts(countMap);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const id = getUserId();
    const name = getUserName();
    setUserId(id);
    setUserNameState(name);
    loadData();
  }, [loadData]);

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setUserNameState(name);
    const id = getUserId();
    setUserId(id);
  };

  const getSelectionKey = (styleId: string) => `${styleId}:${userId}`;

  const handleSelect = async (styleId: string, status: SelectionStatus) => {
    if (!userId || !userName) return;
    const style = styles.find((s) => s.id === styleId);
    if (!style) return;
    const key = getSelectionKey(styleId);
    const prev = selections.get(key);
    try {
      // optimistic update
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
      // rollback
      setSelections((map) => {
        const next = new Map(map);
        if (prev) next.set(key, prev);
        else next.delete(key);
        return next;
      });
      showToast("Failed to save selection", "error");
    }
  };

  const handleAddMemo = async (styleId: string, content: string) => {
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
      setMemoCounts((prev) => {
        const next = new Map(prev);
        next.set(styleId, (prev.get(styleId) ?? 0) + 1);
        return next;
      });
      showToast("Memo added", "success");
    } catch {
      showToast("Failed to save memo", "error");
    }
  };

  const handleLoadMoreMemos = async (styleId: string) => {
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
  };

  const getStatusForStyle = (styleId: string): SelectionStatus | null => {
    if (!userId) return null;
    return selections.get(getSelectionKey(styleId))?.status ?? null;
  };

  const getMemoCountForStyle = (styleId: string): number => {
    return memoCounts.get(styleId) ?? 0;
  };

  const getMemosForStyle = (styleId: string): Memo[] => {
    return styleMemos.get(styleId)?.memos ?? [];
  };

  const getHasMoreMemos = (styleId: string): boolean => {
    return styleMemos.get(styleId)?.hasMore ?? false;
  };

  const reviewedCount = userId
    ? styles.filter((s) => selections.has(getSelectionKey(s.id))).length
    : 0;

  if (!mounted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#fafafa" }}>
        <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!userName) {
    return (
      <>
        <NamePrompt onSubmit={handleNameSubmit} />
        <ToastContainer />
      </>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#fafafa" }}>
        <p style={{ color: "#888", fontSize: 14 }}>Loading collection...</p>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-[#e0e0e0] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-[#333]">HANSOLL SP&apos;27</h1>
          <div className="text-[13px] text-[#888] mt-0.5">
            Talbots Outlet &middot; {reviewedCount}/{styles.length} reviewed
          </div>
        </div>
        <a
          href="/admin"
          className="text-[13px] text-[#E85D2A] border border-[#E85D2A] px-3 py-1.5 rounded-md hover:bg-[#FFF5F0] transition-colors"
        >
          Summary
        </a>
      </header>

      <main className="flex-1 max-w-[800px] mx-auto p-4">
        {(() => {
          const divisions = [...new Set(styles.map((s) => s.division))];
          return divisions.map((division) => {
            const divStyles = styles.filter((s) => s.division === division);
            return (
              <section key={division} className="mb-8">
                <h2 className="text-[15px] font-semibold text-[#333] mb-3">
                  {division}{" "}
                  <span className="font-normal text-[12px] text-[#888]">
                    ({divStyles.length})
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {divStyles.map((style) => (
                    <StyleCard
                      key={style.id}
                      style={style}
                      status={getStatusForStyle(style.id)}
                      memoCount={getMemoCountForStyle(style.id)}
                      onClick={() => setSelectedStyle(style)}
                    />
                  ))}
                </div>
              </section>
            );
          });
        })()}
      </main>

      {selectedStyle && (
        <DetailDrawer
          style={selectedStyle}
          currentStatus={getStatusForStyle(selectedStyle.id)}
          memos={getMemosForStyle(selectedStyle.id)}
          hasMore={getHasMoreMemos(selectedStyle.id)}
          onClose={() => setSelectedStyle(null)}
          onSelect={handleSelect}
          onAddMemo={handleAddMemo}
          onLoadMore={() => handleLoadMoreMemos(selectedStyle.id)}
        />
      )}

      <ToastContainer />
    </>
  );
}
