"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Sun, Moon, Search, Grid3X3, LayoutGrid, Menu, X as XIcon } from "lucide-react";
import type { Style, SelectionStatus, Selection, Memo } from "@/lib/types";
import { getUserId, getUserName, setUserName, STATUS_CONFIG } from "@/lib/store";
import { fetchStyles, fetchSelections, fetchMemosByStyle, upsertSelection, insertMemo } from "@/lib/api";
import StyleCard from "@/components/StyleCard";
import DetailDrawer from "@/components/DetailDrawer";
import NamePrompt from "@/components/NamePrompt";
import ToastContainer, { showToast } from "@/components/Toast";

type FilterType = "all" | "shortlist" | "maybe" | "pass" | "unreviewed";

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

  // Dashboard state
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [gridCols, setGridCols] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [stylesData, selectionsData] = await Promise.all([fetchStyles(), fetchSelections()]);
      setStyles(stylesData);
      const selMap = new Map<string, Selection>();
      for (const s of selectionsData) selMap.set(`${s.style_id}:${s.user_id}`, s);
      setSelections(selMap);

      const memoResults = await Promise.all(stylesData.map((s) => fetchMemosByStyle(s.id, 20, 0)));
      const memoMap = new Map<string, { memos: Memo[]; hasMore: boolean; offset: number }>();
      const countMap = new Map<string, number>();
      stylesData.forEach((s, i) => {
        memoMap.set(s.id, { memos: memoResults[i].data, hasMore: memoResults[i].hasMore, offset: 0 });
        countMap.set(s.id, memoResults[i].data.length + (memoResults[i].hasMore ? 1 : 0));
      });
      setStyleMemos(memoMap);
      setMemoCounts(countMap);
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setMounted(true);
    const id = getUserId();
    const name = getUserName();
    setUserId(id);
    setUserNameState(name);
    loadData();
  }, [loadData]);

  // Dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "");
  }, [darkMode]);

  // Set initial active division
  useEffect(() => {
    if (styles.length > 0 && !activeDivision) {
      const divs = [...new Set(styles.map(s => s.division))];
      setActiveDivision(divs[0] || null);
    }
  }, [styles, activeDivision]);

  const handleNameSubmit = (name: string) => { setUserName(name); setUserNameState(name); setUserId(getUserId()); };
  const getSelectionKey = (styleId: string) => `${styleId}:${userId}`;
  const getStatusForStyle = (styleId: string): SelectionStatus | null => userId ? selections.get(getSelectionKey(styleId))?.status ?? null : null;
  const getMemoCountForStyle = (styleId: string) => memoCounts.get(styleId) ?? 0;
  const getMemosForStyle = (styleId: string) => styleMemos.get(styleId)?.memos ?? [];
  const getHasMoreMemos = (styleId: string) => styleMemos.get(styleId)?.hasMore ?? false;

  const handleSelect = async (styleId: string, status: SelectionStatus) => {
    if (!userId || !userName) return;
    const style = styles.find(s => s.id === styleId);
    if (!style) return;
    const key = getSelectionKey(styleId);
    const prev = selections.get(key);
    try {
      setSelections(map => {
        const next = new Map(map);
        next.set(key, { id: prev?.id ?? "", style_id: styleId, collection: style.collection, user_id: userId, user_name: userName, status, created_at: prev?.created_at ?? new Date().toISOString(), updated_at: new Date().toISOString() });
        return next;
      });
      const saved = await upsertSelection(styleId, style.collection, userId, userName, status);
      setSelections(map => { const next = new Map(map); next.set(key, saved); return next; });
      showToast("Selection saved", "success");
    } catch {
      setSelections(map => { const next = new Map(map); if (prev) next.set(key, prev); else next.delete(key); return next; });
      showToast("Failed to save selection", "error");
    }
  };

  const handleAddMemo = async (styleId: string, content: string) => {
    if (!userId || !userName) return;
    const style = styles.find(s => s.id === styleId);
    if (!style) return;
    try {
      const saved = await insertMemo(styleId, style.collection, userId, userName, content);
      setStyleMemos(prev => { const next = new Map(prev); const ex = prev.get(styleId); next.set(styleId, { memos: [saved, ...(ex?.memos ?? [])], hasMore: ex?.hasMore ?? false, offset: ex?.offset ?? 0 }); return next; });
      setMemoCounts(prev => { const next = new Map(prev); next.set(styleId, (prev.get(styleId) ?? 0) + 1); return next; });
      showToast("Memo added", "success");
    } catch { showToast("Failed to save memo", "error"); }
  };

  const handleLoadMoreMemos = async (styleId: string) => {
    const current = styleMemos.get(styleId);
    const newOffset = (current?.offset ?? 0) + 20;
    try {
      const result = await fetchMemosByStyle(styleId, 20, newOffset);
      setStyleMemos(prev => { const next = new Map(prev); const ex = prev.get(styleId); next.set(styleId, { memos: [...(ex?.memos ?? []), ...result.data], hasMore: result.hasMore, offset: newOffset }); return next; });
    } catch { showToast("Failed to load more memos", "error"); }
  };

  // Derived data
  const divisions = useMemo(() => [...new Set(styles.map(s => s.division))], [styles]);

  const divisionStats = useMemo(() => {
    return divisions.map(div => {
      const divStyles = styles.filter(s => s.division === div);
      const reviewed = userId ? divStyles.filter(s => selections.has(getSelectionKey(s.id))).length : 0;
      return { name: div, total: divStyles.length, reviewed };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisions, styles, selections, userId]);

  const totalReviewed = divisionStats.reduce((sum, d) => sum + d.reviewed, 0);
  const totalStyles = styles.length;

  const filteredStyles = useMemo(() => {
    let result = styles.filter(s => s.division === activeDivision);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.id.toLowerCase().includes(q) || s.contents.toLowerCase().includes(q) || s.construction.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      result = result.filter(s => {
        const status = getStatusForStyle(s.id);
        if (filter === "unreviewed") return !status;
        return status === filter;
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles, activeDivision, searchQuery, filter, selections, userId]);

  // Pre-render checks
  if (!mounted) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}><p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p></div>;
  if (!userName) return <><NamePrompt onSubmit={handleNameSubmit} /><ToastContainer /></>;
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}><p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading collection...</p></div>;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "shortlist", label: "Shortlist" },
    { key: "maybe", label: "Maybe" },
    { key: "pass", label: "Pass" },
    { key: "unreviewed", label: "Unreviewed" },
  ];

  const activeDivStats = divisionStats.find(d => d.name === activeDivision);

  return (
    <>
      <style>{`
        .sidebar-desktop { display: flex; flex-direction: column; }
        .hamburger-btn { display: none; }
        .grid-toggle-desktop { display: flex; }
        .filter-scroll { display: flex; }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .card-meta-text {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .header-title { font-size: 22px; }
        .header-sub { font-size: 13px; }
        .dark-toggle { width: 36px; height: 36px; }
        .main-padding { padding: 24px 32px; }
        .controls-gap { gap: 16px; margin-bottom: 24px; }
        .div-title { font-size: 26px; }

        @media (max-width: 639px) {
          .sidebar-desktop { display: none; }
          .hamburger-btn { display: flex; }
          .grid-toggle-desktop { display: none !important; }
          .card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .card-meta-text { -webkit-line-clamp: 1; }
          .header-title { font-size: 16px !important; }
          .header-sub { font-size: 11px !important; }
          .dark-toggle { width: 32px !important; height: 32px !important; }
          .main-padding { padding: 16px !important; }
          .controls-gap { gap: 8px; margin-bottom: 12px; }
          .div-title { font-size: 20px !important; }
          .filter-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .filter-scroll::-webkit-scrollbar { display: none; }
          .filter-btn { font-size: 11px !important; padding: 6px 10px !important; white-space: nowrap; }
          .search-input { width: 140px !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .sidebar-desktop { width: 200px !important; }
          .card-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 14px !important;
          }
        }
        @media (min-width: 1024px) {
          .card-meta-text { -webkit-line-clamp: 2; }
        }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
        {/* ===== TOP HEADER ===== */}
        <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Hamburger (mobile) */}
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}
                style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <Menu size={20} />
              </button>
              <button onClick={() => { setUserNameState(null); localStorage.removeItem("hansoll-user-name"); }}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" as const, padding: 0 }} title="Back to onboarding">
                <h1 className="header-title" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--text-primary)", margin: 0 }}>HANSOLL SP&apos;27</h1>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span className="header-sub" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
                Talbots Outlet &middot; <span style={{ fontVariantNumeric: "tabular-nums" }}>{totalReviewed}/{totalStyles}</span> reviewed
              </span>
              <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}
                style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 9999, background: "none", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s" }}>
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--border)" }}>
            <div style={{ height: "100%", background: "var(--accent)", width: `${totalStyles > 0 ? (totalReviewed / totalStyles) * 100 : 0}%`, transition: "width 0.3s" }} />
          </div>
        </header>

        {/* ===== BODY: Sidebar + Main ===== */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="sidebar-mobile-overlay open" style={{ position: "fixed", inset: 0, zIndex: 100 }}>
              <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 280, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>DIVISIONS</span>
                  <button onClick={() => setSidebarOpen(false)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><XIcon size={18} /></button>
                </div>
                {renderDivisionList(true)}
              </div>
            </div>
          )}

          {/* Desktop sidebar */}
          <aside className="sidebar-desktop" style={{ width: 240, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", height: "100%", overflow: "hidden" }}>
            <div style={{ flex: 1, padding: "24px 16px", overflowY: "auto" }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16 }}>DIVISIONS</div>
              {renderDivisionList(false)}
            </div>
            {/* Summary button */}
            <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
              <a href="/admin" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", minHeight: 40, border: "1px solid var(--accent)", borderRadius: 4,
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--accent)",
                textDecoration: "none", transition: "all 0.15s", cursor: "pointer",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
              >Summary</a>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="main-padding" style={{ flex: 1, overflowY: "auto" }}>
            {/* Division header + controls */}
            <div className="controls-gap" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h2 className="div-title" style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", margin: 0 }}>{activeDivision}</h2>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)" }}>({activeDivStats?.total ?? 0})</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    className="search-input"
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search style..."
                    style={{ width: 180, padding: "6px 10px 6px 30px", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-primary)", background: "var(--surface)", outline: "none", minHeight: 32 }}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Filter buttons */}
                <div className="filter-scroll" style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  {FILTERS.map(f => (
                    <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)}
                      style={{
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                        padding: "4px 10px", border: "none", cursor: "pointer",
                        background: filter === f.key ? "var(--text-primary)" : "transparent",
                        color: filter === f.key ? "var(--surface)" : "var(--text-muted)",
                        transition: "all 0.15s", minHeight: 32,
                        borderRight: "1px solid var(--border)",
                      }}
                      onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.background = "var(--bg)"; }}
                      onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.background = "transparent"; }}
                    >{f.label}</button>
                  ))}
                </div>

                {/* Grid toggle */}
                <div className="grid-toggle-desktop" style={{ border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <button onClick={() => setGridCols(3)}
                    style={{ padding: "4px 8px", border: "none", cursor: "pointer", minHeight: 32, display: "flex", alignItems: "center", background: gridCols === 3 ? "var(--text-primary)" : "transparent", color: gridCols === 3 ? "var(--surface)" : "var(--text-muted)", transition: "all 0.15s" }}>
                    <Grid3X3 size={14} />
                  </button>
                  <button onClick={() => setGridCols(4)}
                    style={{ padding: "4px 8px", border: "none", cursor: "pointer", minHeight: 32, display: "flex", alignItems: "center", borderLeft: "1px solid var(--border)", background: gridCols === 4 ? "var(--text-primary)" : "transparent", color: gridCols === 4 ? "var(--surface)" : "var(--text-muted)", transition: "all 0.15s" }}>
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            {filteredStyles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 15 }}>No styles found.</p>
                {(searchQuery || filter !== "all") && (
                  <button onClick={() => { setSearchQuery(""); setFilter("all"); }}
                    style={{ marginTop: 8, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="card-grid" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                {filteredStyles.map(style => (
                  <StyleCard
                    key={style.id}
                    style={style}
                    status={getStatusForStyle(style.id)}
                    memoCount={getMemoCountForStyle(style.id)}
                    onClick={() => setSelectedStyle(style)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Detail modal */}
      {selectedStyle && (() => {
        const idx = filteredStyles.findIndex(s => s.id === selectedStyle.id);
        return (
          <DetailDrawer
            style={selectedStyle}
            currentStatus={getStatusForStyle(selectedStyle.id)}
            memos={getMemosForStyle(selectedStyle.id)}
            hasMore={getHasMoreMemos(selectedStyle.id)}
            onClose={() => setSelectedStyle(null)}
            onSelect={handleSelect}
            onAddMemo={handleAddMemo}
            onLoadMore={() => handleLoadMoreMemos(selectedStyle.id)}
            styleIndex={idx}
            totalStyles={filteredStyles.length}
            prevStyleId={idx > 0 ? filteredStyles[idx - 1].id : undefined}
            nextStyleId={idx < filteredStyles.length - 1 ? filteredStyles[idx + 1].id : undefined}
            onNavigate={(dir) => {
              const next = dir === "prev" ? filteredStyles[idx - 1] : filteredStyles[idx + 1];
              if (next) setSelectedStyle(next);
            }}
          />
        );
      })()}

      <ToastContainer />
    </>
  );

  function renderDivisionList(mobile: boolean) {
    return (
      <div>
        {divisionStats.map(div => {
          const isActive = div.name === activeDivision;
          const pct = div.total > 0 ? (div.reviewed / div.total) * 100 : 0;
          return (
            <button
              key={div.name}
              onClick={() => { setActiveDivision(div.name); setFilter("all"); setSearchQuery(""); if (mobile) setSidebarOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left" as const,
                padding: isActive ? "8px 12px 8px 9px" : "8px 12px",
                marginBottom: 4, borderRadius: 8, cursor: "pointer",
                background: isActive ? "var(--accent-light)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--accent-light)" : "transparent"; }}
            >
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{div.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{div.total} styles</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--accent)", width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{div.reviewed}/{div.total}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
}
