"use client";

import Mono from "./Mono";
import type { FilterKey } from "./palette";

export default function Sidebar({
  divisions,
  activeDivision,
  setActiveDivision,
  counts,
  reviewedPct,
  filter,
  setFilter,
  collectionLabel,
  onSummary,
  showShortcuts = true,
}: {
  divisions: string[];
  activeDivision: string;
  setActiveDivision: (division: string) => void;
  counts: Record<FilterKey, number>;
  reviewedPct: number;
  filter: FilterKey;
  setFilter: (filter: FilterKey) => void;
  collectionLabel: string;
  onSummary?: () => void;
  showShortcuts?: boolean;
}) {
  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: "All styles" },
    { key: "unreviewed", label: "Unreviewed" },
    { key: "shortlist", label: "Pick" },
    { key: "maybe", label: "Hold" },
    { key: "pass", label: "Skip" },
  ];

  return (
    <aside className="mock-sidebar">
      <div className="mock-sidebar-block">
        <Mono muted>Workspace</Mono>
        <div className="mock-brand-mark">
          <span>H</span>
          HANSOLL {collectionLabel}
        </div>
      </div>

      <div className="mock-sidebar-block">
        <Mono muted>Progress</Mono>
        <div className="mock-progress-title">
          <span>Talbots Outlet</span>
          <Mono>{counts.all}</Mono>
        </div>
        <div className="mock-progress-track">
          <div style={{ width: `${reviewedPct}%` }} />
        </div>
        <div className="mock-progress-meta">
          <Mono muted>{reviewedPct}% reviewed</Mono>
          <Mono muted>{counts.all - counts.unreviewed}/{counts.all}</Mono>
        </div>
      </div>

      {divisions.length > 0 && (
        <div className="mock-sidebar-block">
          <Mono muted>Division</Mono>
          <div className="mock-menu">
            {divisions.map((division) => (
              <button
                key={division}
                className={division === activeDivision ? "active" : ""}
                onClick={() => setActiveDivision(division)}
              >
                <span>{division}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mock-sidebar-block mock-sidebar-grow">
        <Mono muted>Filter</Mono>
        <div className="mock-menu">
          {filters.map((item) => (
            <button
              key={item.key}
              className={filter === item.key ? "active" : ""}
              onClick={() => setFilter(item.key)}
            >
              <span>{item.label}</span>
              <Mono muted>{counts[item.key]}</Mono>
            </button>
          ))}
        </div>
      </div>

      <div className="mock-sidebar-footer">
        {onSummary && (
          <button
            type="button"
            className="mock-sidebar-summary"
            onClick={onSummary}
            style={{ display: "flex", justifyContent: "space-between", padding: "0 12px", gap: 8 }}
          >
            <span>Selection summary</span>
            <span className="mock-kbd">S</span>
          </button>
        )}
        {showShortcuts && (
          <div>
            <Mono muted>Shortcuts</Mono>
            <span className="mock-kbd">1</span>
            <span className="mock-kbd">2</span>
            <span className="mock-kbd">3</span>
          </div>
        )}
      </div>
    </aside>
  );
}
