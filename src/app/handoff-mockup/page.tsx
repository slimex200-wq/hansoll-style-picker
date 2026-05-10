"use client";

import { useEffect, useMemo, useState } from "react";
import type { Style, SelectionStatus } from "@/lib/types";
import { fetchStyles } from "@/lib/api";
import { MOCK_STYLES } from "@/lib/mock-data";
import HandoffStyles from "@/components/handoff/HandoffStyles";
import Sidebar from "@/components/handoff/Sidebar";
import TopBar from "@/components/handoff/TopBar";
import ListView from "@/components/handoff/ListView";
import GalleryView from "@/components/handoff/GalleryView";
import DetailPanel from "@/components/handoff/DetailPanel";
import {
  PALETTE,
  getCollectionLabel,
  getFabricRows,
} from "@/components/handoff/palette";
import type { FilterKey, ViewMode } from "@/components/handoff/palette";

const SEEDED_STATUS: Array<SelectionStatus | null> = [
  null,
  "shortlist",
  null,
  "maybe",
  null,
  "pass",
  null,
  null,
  "shortlist",
  null,
  "maybe",
  null,
];

function getDemoStatus(
  style: Style,
  index: number,
  decisions: Record<string, SelectionStatus | null>
): SelectionStatus | null {
  return Object.prototype.hasOwnProperty.call(decisions, style.id)
    ? decisions[style.id]
    : SEEDED_STATUS[index % SEEDED_STATUS.length];
}

export default function HandoffMockupPage() {
  const [styles, setStyles] = useState<Style[]>(MOCK_STYLES);
  const [dataSource, setDataSource] = useState("Mock data");
  const [activeDivision, setActiveDivision] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_STYLES[0]?.id ?? null);
  const [decisions, setDecisions] = useState<Record<string, SelectionStatus | null>>({});

  useEffect(() => {
    let cancelled = false;
    fetchStyles()
      .then((liveStyles) => {
        if (cancelled || liveStyles.length === 0) return;
        setStyles(liveStyles);
        setSelectedId(liveStyles[0]?.id ?? null);
        setDataSource("Live data");
      })
      .catch(() => {
        setDataSource("Mock data");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const divisions = useMemo(
    () => [...new Set(styles.map((style) => style.division || "Unassigned"))],
    [styles]
  );
  const currentDivision = activeDivision && divisions.includes(activeDivision) ? activeDivision : divisions[0] ?? "";

  const visibleStyles = useMemo(() => {
    return styles
      .filter((style) => (currentDivision ? (style.division || "Unassigned") === currentDivision : true))
      .filter((style, index) => {
        const status = getDemoStatus(style, index, decisions);
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
  }, [currentDivision, decisions, filter, search, styles]);

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = {
      all: styles.length,
      unreviewed: 0,
      shortlist: 0,
      maybe: 0,
      pass: 0,
    };
    styles.forEach((style, index) => {
      const status = getDemoStatus(style, index, decisions);
      if (!status) result.unreviewed += 1;
      else result[status] += 1;
    });
    return result;
  }, [decisions, styles]);

  const selectedStyle = useMemo(() => {
    return visibleStyles.find((style) => style.id === selectedId) ?? visibleStyles[0] ?? styles[0] ?? null;
  }, [selectedId, styles, visibleStyles]);

  const selectedIndex = selectedStyle ? visibleStyles.findIndex((style) => style.id === selectedStyle.id) : -1;
  const selectedStatus = selectedStyle ? getDemoStatus(selectedStyle, Math.max(selectedIndex, 0), decisions) : null;
  const reviewedPct = counts.all > 0 ? Math.round(((counts.all - counts.unreviewed) / counts.all) * 100) : 0;
  const collectionLabel = getCollectionLabel(styles);

  const handleDecision = (style: Style, status: SelectionStatus) => {
    const index = styles.findIndex((item) => item.id === style.id);
    const current = getDemoStatus(style, index, decisions);
    setDecisions((next) => ({
      ...next,
      [style.id]: current === status ? null : status,
    }));
  };

  const moveSelection = (direction: "prev" | "next") => {
    if (!selectedStyle || visibleStyles.length === 0) return;
    const currentIndex = Math.max(0, visibleStyles.findIndex((style) => style.id === selectedStyle.id));
    const nextIndex =
      direction === "prev"
        ? (currentIndex - 1 + visibleStyles.length) % visibleStyles.length
        : (currentIndex + 1) % visibleStyles.length;
    setSelectedId(visibleStyles[nextIndex].id);
  };

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
            dataSource={dataSource}
            showDataSource
            avatarInitials="HS"
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
            />

            <main className="mock-content">
              <div className="mock-content-header">
                <div>
                  <h1>{currentDivision || "Collection"}</h1>
                  <p>
                    {visibleStyles.length} shown from {styles.length} styles, with fabric match and marked-up YD price in the review path.
                  </p>
                </div>
                <div className="mock-review-note">
                  Direction check: denser operations layout, list-first review, pinned side detail, and fabric data visible without leaving the garment.
                </div>
              </div>

              {visibleStyles.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center", color: PALETTE.inkLight }}>
                  No styles match this view.
                </div>
              ) : view === "list" ? (
                <ListView
                  styles={visibleStyles}
                  getStatus={(style) => {
                    const idx = visibleStyles.findIndex((s) => s.id === style.id);
                    return getDemoStatus(style, Math.max(idx, 0), decisions);
                  }}
                  selectedId={selectedStyle?.id ?? null}
                  onSelectStyle={setSelectedId}
                  onDecision={handleDecision}
                />
              ) : (
                <GalleryView
                  styles={visibleStyles}
                  getStatus={(style) => {
                    const idx = visibleStyles.findIndex((s) => s.id === style.id);
                    return getDemoStatus(style, Math.max(idx, 0), decisions);
                  }}
                  selectedId={selectedStyle?.id ?? null}
                  onSelectStyle={setSelectedId}
                  onDecision={handleDecision}
                />
              )}
            </main>

            {selectedStyle && (
              <DetailPanel
                style={selectedStyle}
                status={selectedStatus}
                onDecision={(decision) => handleDecision(selectedStyle, decision)}
                onPrev={() => moveSelection("prev")}
                onNext={() => moveSelection("next")}
                index={Math.max(selectedIndex, 0)}
                total={Math.max(visibleStyles.length, 1)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
