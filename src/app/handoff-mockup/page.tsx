"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  Upload,
} from "lucide-react";
import type { Style, SelectionStatus } from "@/lib/types";
import type { FabricDetail } from "@/lib/fabric-details";
import { fetchStyles } from "@/lib/api";
import { MOCK_STYLES } from "@/lib/mock-data";

type ViewMode = "list" | "gallery";
type FilterKey = "all" | "unreviewed" | SelectionStatus;

const PALETTE = {
  bg: "#fbf8f3",
  panel: "#ffffff",
  rule: "#ebe6dc",
  ruleSoft: "#f3eee4",
  ink: "#1a1815",
  inkSoft: "#5a564f",
  inkLight: "#9a958c",
  peach: "#c96442",
  peachBg: "#fae9e1",
  sage: "#7a936f",
  sageBg: "#eef1ec",
  amber: "#b88a2c",
  amberBg: "#f6efdc",
};

const STATUS_META: Record<SelectionStatus, { label: string; color: string; bg: string }> = {
  shortlist: { label: "Shortlist", color: PALETTE.sage, bg: PALETTE.sageBg },
  maybe: { label: "Maybe", color: PALETTE.amber, bg: PALETTE.amberBg },
  pass: { label: "Pass", color: PALETTE.peach, bg: PALETTE.peachBg },
};

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

function formatDisplayPrice(price?: string): string | null {
  if (!price) return null;
  const parsed = Number.parseFloat(price.replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return `$${(parsed + 0.2).toFixed(2)}/YD`;
}

function joinParts(...parts: Array<string | null | undefined | false>): string {
  return parts.filter(Boolean).join(" / ");
}

function demoPriceForStyle(styleId: string): string {
  const seed = Array.from(styleId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (2.35 + (seed % 8) * 0.18).toFixed(2);
}

function inferConstruction(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("terry")) return "French Terry";
  if (normalized.includes("jacquard")) return "Quilt Jacquard";
  if (normalized.includes("thermal")) return "Thermal";
  if (normalized.includes("rib")) return "Rib";
  if (normalized.includes("jersey")) return "Single Jersey";
  return "";
}

function getFabricRows(style: Style): FabricDetail[] {
  if (style.fabric_details?.length) return style.fabric_details;
  if (!style.fabric_suggestion) return [];
  return [
    {
      sourceSheet: style.division,
      pattern: "",
      styleId: style.id,
      option: "mock",
      fabricCode: style.fabric_suggestion.fabric_no,
      supplier: "Mapped supplier",
      construction: inferConstruction(style.fabric_suggestion.fabric_no),
      content: style.fabric_suggestion.contents,
      widthInch: "58/60",
      weightGm2: style.fabric_suggestion.weight.replace(/[^0-9.]/g, ""),
      priceYd: demoPriceForStyle(style.id),
      priceLb: "",
      finish: "",
      yarnDetail: "",
      comment: "Mock fallback row for handoff preview when live Excel mapping is not available locally.",
      fabricCountry: "",
      originalText: style.fabric_suggestion.fabric_no,
    },
  ];
}

function getPrimaryFabric(style: Style): FabricDetail | null {
  return getFabricRows(style)[0] ?? null;
}

function getFabricLabel(style: Style): string {
  const detail = getPrimaryFabric(style);
  if (detail) {
    return joinParts(detail.content, detail.construction || detail.originalText);
  }
  if (style.fabric_suggestion) {
    return joinParts(style.fabric_suggestion.contents, style.fabric_suggestion.fabric_no);
  }
  return joinParts(style.contents, style.construction);
}

function getCollectionLabel(styles: Style[]): string {
  const raw = styles[0]?.collection;
  if (!raw) return "SP'27";
  const match = raw.match(/^(SP|SU|FA|FW|HO|SS)(\d{2})/i);
  return match ? `${match[1].toUpperCase()}'${match[2]}` : raw;
}

function Mono({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <span className={muted ? "mock-mono mock-muted" : "mock-mono"}>{children}</span>;
}

function StatusDot({ status }: { status: SelectionStatus | null }) {
  if (!status) return <span className="mock-status empty">Unreviewed</span>;
  const meta = STATUS_META[status];
  return (
    <span className="mock-status" style={{ color: meta.color, background: meta.bg }}>
      <span style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function StyleVisual({ style, className = "" }: { style: Style; className?: string }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = style.image_url && !failed ? style.image_url : "";

  return (
    <div className={`mock-visual ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${style.id} garment`}
          fill
          unoptimized
          sizes="(max-width: 900px) 55vw, 360px"
          className="mock-visual-img"
          onError={() => setFailed(true)}
        />
      ) : (
        <GarmentFallback id={style.id} fabric={style.contents} />
      )}
    </div>
  );
}

function GarmentFallback({ id, fabric }: { id: string; fabric: string }) {
  const seed = id.charCodeAt(id.length - 1) || 0;
  const base = ["#eee7dc", "#d7dfd0", "#d7dbe8", "#ead8cf", "#d9d2c3"][seed % 5];
  const dark = ["#4a4038", "#3d5145", "#35475c", "#7d513f", "#5d5448"][seed % 5];
  const stripe = fabric.toLowerCase().includes("cotton") || seed % 3 === 0;

  return (
    <svg viewBox="0 0 220 280" aria-hidden="true" className="mock-fallback-svg">
      <rect width="220" height="280" fill="#f5f3ee" />
      <path
        d="M109 23c-7 7-8 14-1 20M54 55l55-22 57 22"
        fill="none"
        stroke="#8b8378"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M57 63 34 168l29 13 15-88v139c0 11 7 18 18 18h28c11 0 18-7 18-18V93l15 88 29-13-23-105c-16 9-34 13-53 13s-37-4-53-13Z"
        fill={base}
        stroke="#8f867b"
        strokeWidth="1"
      />
      <path d="M82 58c16 16 40 16 56 0" fill="none" stroke="#8f867b" strokeWidth="2" />
      {stripe &&
        Array.from({ length: 12 }).map((_, index) => (
          <line
            key={index}
            x1="68"
            x2="152"
            y1={105 + index * 10}
            y2={105 + index * 10}
            stroke={dark}
            strokeWidth="3"
            opacity="0.2"
          />
        ))}
      <text
        x="110"
        y="266"
        textAnchor="middle"
        fill="#9a958c"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
      >
        {id}
      </text>
    </svg>
  );
}

function FabricTexture({ style }: { style: Style }) {
  const detail = getPrimaryFabric(style);
  const fabricText = `${style.contents} ${style.construction} ${detail?.construction ?? ""}`.toLowerCase();
  const isRib = fabricText.includes("rib");
  const isTerry = fabricText.includes("terry");
  const isJacquard = fabricText.includes("jacquard");

  return (
    <div
      className="mock-fabric-texture"
      style={{
        backgroundImage: isRib
          ? "repeating-linear-gradient(90deg, rgba(26,24,21,.18) 0 3px, transparent 3px 12px), linear-gradient(135deg, #ded6ca, #f2ede4)"
          : isTerry
            ? "radial-gradient(circle at 20% 25%, rgba(26,24,21,.18) 0 2px, transparent 3px), radial-gradient(circle at 70% 70%, rgba(26,24,21,.16) 0 2px, transparent 3px), linear-gradient(135deg, #e4d9c8, #f4eee2)"
            : isJacquard
              ? "linear-gradient(45deg, rgba(26,24,21,.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(26,24,21,.12) 25%, transparent 25%), linear-gradient(135deg, #ded9cf, #f2eee6)"
              : "repeating-linear-gradient(135deg, rgba(26,24,21,.12) 0 1px, transparent 1px 7px), linear-gradient(135deg, #e6ded2, #f5efe6)",
        backgroundSize: isJacquard ? "22px 22px, 22px 22px, auto" : undefined,
      }}
    />
  );
}

function Sidebar({
  divisions,
  activeDivision,
  setActiveDivision,
  counts,
  reviewedPct,
  filter,
  setFilter,
  collectionLabel,
}: {
  divisions: string[];
  activeDivision: string;
  setActiveDivision: (division: string) => void;
  counts: Record<FilterKey, number>;
  reviewedPct: number;
  filter: FilterKey;
  setFilter: (filter: FilterKey) => void;
  collectionLabel: string;
}) {
  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: "All styles" },
    { key: "unreviewed", label: "Unreviewed" },
    { key: "shortlist", label: "Shortlist" },
    { key: "maybe", label: "Maybe" },
    { key: "pass", label: "Pass" },
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
        <button>Selection summary</button>
        <div>
          <Mono muted>Shortcuts</Mono>
          <span className="mock-kbd">1</span>
          <span className="mock-kbd">2</span>
          <span className="mock-kbd">3</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  search,
  setSearch,
  view,
  setView,
  total,
  dataSource,
}: {
  search: string;
  setSearch: (value: string) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  total: number;
  dataSource: string;
}) {
  return (
    <header className="mock-topbar">
      <div className="mock-top-left">
        <Mono muted>Outlet</Mono>
        <span className="mock-dot-separator" />
        <Mono>{total} styles</Mono>
        <span className="mock-source-pill">{dataSource}</span>
      </div>
      <label className="mock-search">
        <Search size={14} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search style, fabric, supplier" />
        <span className="mock-kbd">/</span>
      </label>
      <div className="mock-actions">
        <div className="mock-segmented">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view">
            <List size={14} />
            <span>List</span>
          </button>
          <button className={view === "gallery" ? "active" : ""} onClick={() => setView("gallery")} aria-label="Gallery view">
            <Grid2X2 size={14} />
            <span>Gallery</span>
          </button>
        </div>
        <a className="mock-upload" href="/admin/upload">
          <Upload size={14} />
          Upload Data
        </a>
        <span className="mock-avatar">HS</span>
      </div>
    </header>
  );
}

function DecisionButtons({
  current,
  onSelect,
}: {
  current: SelectionStatus | null;
  onSelect: (status: SelectionStatus) => void;
}) {
  return (
    <div className="mock-decision-buttons">
      {(Object.keys(STATUS_META) as SelectionStatus[]).map((status) => {
        const active = current === status;
        const meta = STATUS_META[status];
        return (
          <button
            key={status}
            className={active ? "active" : ""}
            style={active ? { borderColor: meta.color, background: meta.bg, color: meta.color } : undefined}
            onClick={() => onSelect(status)}
          >
            {meta.label.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

function ListView({
  styles,
  decisions,
  selectedId,
  onSelectStyle,
  onDecision,
}: {
  styles: Style[];
  decisions: Record<string, SelectionStatus | null>;
  selectedId: string | null;
  onSelectStyle: (id: string) => void;
  onDecision: (style: Style, status: SelectionStatus) => void;
}) {
  return (
    <div className="mock-list">
      <div className="mock-list-head">
        <Mono muted>#</Mono>
        <Mono muted>Image</Mono>
        <Mono muted>Style</Mono>
        <Mono muted>Garment fabric</Mono>
        <Mono muted>Weight</Mono>
        <Mono muted>Matched fabric</Mono>
        <Mono muted>YD price</Mono>
        <Mono muted>Status</Mono>
        <Mono muted>Quick</Mono>
      </div>
      {styles.map((style, index) => {
        const detail = getPrimaryFabric(style);
        const rowPrice = formatDisplayPrice(detail?.priceYd);
        const status = getDemoStatus(style, index, decisions);
        return (
          <button
            key={style.id}
            className={selectedId === style.id ? "mock-list-row selected" : "mock-list-row"}
            onClick={() => onSelectStyle(style.id)}
          >
            <Mono muted>{String(index + 1).padStart(2, "0")}</Mono>
            <StyleVisual style={style} className="thumb" />
            <div className="mock-row-code">
              <Mono>{style.id}</Mono>
              <span>{style.division}</span>
              {rowPrice && <em>{rowPrice}</em>}
            </div>
            <span className="mock-truncate">{getFabricLabel(style)}</span>
            <Mono muted>{style.weight || detail?.weightGm2 || "-"}</Mono>
            <span className="mock-truncate">{detail?.fabricCode || style.fabric_suggestion?.fabric_no || "-"}</span>
            <Mono>{formatDisplayPrice(detail?.priceYd) ?? "-"}</Mono>
            <StatusDot status={status} />
            <span onClick={(event) => event.stopPropagation()}>
              <DecisionButtons current={status} onSelect={(decision) => onDecision(style, decision)} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GalleryView({
  styles,
  decisions,
  selectedId,
  onSelectStyle,
  onDecision,
}: {
  styles: Style[];
  decisions: Record<string, SelectionStatus | null>;
  selectedId: string | null;
  onSelectStyle: (id: string) => void;
  onDecision: (style: Style, status: SelectionStatus) => void;
}) {
  return (
    <div className="mock-gallery">
      {styles.map((style, index) => {
        const status = getDemoStatus(style, index, decisions);
        const detail = getPrimaryFabric(style);
        return (
          <button
            key={style.id}
            className={selectedId === style.id ? "mock-gallery-card selected" : "mock-gallery-card"}
            onClick={() => onSelectStyle(style.id)}
          >
            <StyleVisual style={style} />
            <div className="mock-gallery-body">
              <div className="mock-gallery-title">
                <Mono>{style.id}</Mono>
                <Mono muted>{formatDisplayPrice(detail?.priceYd) ?? style.weight}</Mono>
              </div>
              <p>{getFabricLabel(style)}</p>
              <div className="mock-gallery-actions" onClick={(event) => event.stopPropagation()}>
                <StatusDot status={status} />
                <DecisionButtons current={status} onSelect={(decision) => onDecision(style, decision)} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailPanel({
  style,
  status,
  onDecision,
  onPrev,
  onNext,
  index,
  total,
}: {
  style: Style;
  status: SelectionStatus | null;
  onDecision: (status: SelectionStatus) => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
}) {
  const [visualTab, setVisualTab] = useState<"garment" | "fabric" | "detail">("garment");
  const fabricRows = getFabricRows(style);
  const primary = fabricRows[0] ?? null;
  const detailPrice = formatDisplayPrice(primary?.priceYd);

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
        {visualTab === "garment" && <StyleVisual style={style} />}
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
                <div key={`${detail.styleId}-${detail.fabricCode}-${detail.option}-${detailIndex}`} className="mock-fabric-card">
                  <div className="mock-fabric-card-head">
                    <b>{detail.fabricCode || detail.originalText || "Mapped fabric"}</b>
                    {detail.option && <span>{detail.option}</span>}
                  </div>
                  <p>{joinParts(detail.supplier, detail.fabricCountry)}</p>
                  <p>{joinParts(detail.construction, detail.content, detail.widthInch && `W ${detail.widthInch}"`, detail.weightGm2 && `${detail.weightGm2} g/m2`)}</p>
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
          <textarea placeholder="Add buyer or internal note..." rows={3} />
        </section>
      </div>
    </aside>
  );
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

  const divisions = useMemo(() => [...new Set(styles.map((style) => style.division || "Unassigned"))], [styles]);
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
      <style>{`
        .mock-page {
          height: 100vh;
          overflow: hidden;
          background: ${PALETTE.bg};
          color: ${PALETTE.ink};
          font-family: var(--font-body), Inter, system-ui, sans-serif;
        }
        .mock-page button, .mock-page input, .mock-page textarea {
          font-family: inherit;
        }
        .mock-shell {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .mock-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: ${PALETTE.ink};
          font-variant-numeric: tabular-nums;
        }
        .mock-muted {
          color: ${PALETTE.inkLight};
        }
        .mock-kbd {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${PALETTE.rule};
          border-radius: 3px;
          background: ${PALETTE.panel};
          color: ${PALETTE.inkSoft};
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 600;
        }
        .mock-topbar {
          height: 46px;
          padding: 0 16px;
          border-bottom: 1px solid ${PALETTE.rule};
          display: grid;
          grid-template-columns: minmax(210px, auto) minmax(240px, 420px) auto;
          align-items: center;
          gap: 12px;
          background: ${PALETTE.bg};
          flex-shrink: 0;
        }
        .mock-top-left, .mock-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .mock-dot-separator {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${PALETTE.inkLight};
        }
        .mock-source-pill {
          border: 1px solid ${PALETTE.rule};
          border-radius: 999px;
          padding: 3px 8px;
          color: ${PALETTE.inkSoft};
          background: ${PALETTE.panel};
          font-size: 11px;
          white-space: nowrap;
        }
        .mock-search {
          height: 30px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          background: ${PALETTE.panel};
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 8px 0 10px;
          min-width: 0;
        }
        .mock-search svg {
          color: ${PALETTE.inkLight};
          flex-shrink: 0;
        }
        .mock-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: ${PALETTE.ink};
          font-size: 12px;
        }
        .mock-actions {
          justify-content: flex-end;
        }
        .mock-segmented {
          height: 30px;
          display: flex;
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          overflow: hidden;
          background: ${PALETTE.panel};
        }
        .mock-segmented button, .mock-upload {
          height: 30px;
          border: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          color: ${PALETTE.inkSoft};
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }
        .mock-segmented button + button {
          border-left: 1px solid ${PALETTE.rule};
        }
        .mock-segmented button.active {
          color: #fff;
          background: ${PALETTE.ink};
        }
        .mock-upload {
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          background: ${PALETTE.panel};
          color: ${PALETTE.ink};
        }
        .mock-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${PALETTE.sage};
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }
        .mock-body {
          flex: 1;
          display: flex;
          min-height: 0;
        }
        .mock-sidebar {
          width: 236px;
          flex-shrink: 0;
          border-right: 1px solid ${PALETTE.rule};
          background: ${PALETTE.bg};
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .mock-sidebar-block {
          padding: 14px;
          border-bottom: 1px solid ${PALETTE.rule};
        }
        .mock-sidebar-grow {
          flex: 1;
          overflow: auto;
        }
        .mock-brand-mark {
          margin-top: 7px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
        }
        .mock-brand-mark span {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${PALETTE.peach};
          color: #fff;
          font-family: Georgia, serif;
          font-style: italic;
        }
        .mock-progress-title, .mock-progress-meta {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .mock-progress-title {
          padding: 8px 10px;
          border-radius: 6px;
          background: ${PALETTE.peachBg};
          font-size: 13px;
          font-weight: 600;
        }
        .mock-progress-track {
          height: 4px;
          margin-top: 9px;
          border-radius: 3px;
          background: ${PALETTE.ruleSoft};
          overflow: hidden;
        }
        .mock-progress-track div {
          height: 100%;
          background: ${PALETTE.peach};
        }
        .mock-menu {
          margin-top: 9px;
          display: grid;
          gap: 2px;
        }
        .mock-menu button {
          min-height: 31px;
          border: 0;
          border-radius: 5px;
          padding: 0 10px;
          background: transparent;
          color: ${PALETTE.inkSoft};
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
        }
        .mock-menu button:hover,
        .mock-menu button.active {
          background: ${PALETTE.peachBg};
          color: ${PALETTE.ink};
        }
        .mock-sidebar-footer {
          padding: 12px;
          border-top: 1px solid ${PALETTE.rule};
          display: grid;
          gap: 9px;
        }
        .mock-sidebar-footer button {
          min-height: 34px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          background: ${PALETTE.panel};
          color: ${PALETTE.ink};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .mock-sidebar-footer div {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .mock-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: ${PALETTE.panel};
        }
        .mock-content-header {
          min-height: 52px;
          padding: 11px 16px;
          border-bottom: 1px solid ${PALETTE.rule};
          background: ${PALETTE.bg};
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .mock-content-header h1 {
          margin: 0;
          font-size: 18px;
          line-height: 1.1;
          font-weight: 700;
        }
        .mock-content-header p {
          margin: 3px 0 0;
          color: ${PALETTE.inkLight};
          font-size: 12px;
        }
        .mock-review-note {
          max-width: 470px;
          color: ${PALETTE.inkSoft};
          font-size: 12px;
          line-height: 1.45;
          text-align: right;
        }
        .mock-list {
          flex: 1;
          overflow: auto;
        }
        .mock-list-head,
        .mock-list-row {
          display: grid;
          grid-template-columns: 40px 58px 132px minmax(180px, 1fr) 94px minmax(130px, 170px) 76px 96px 112px;
          gap: 12px;
          align-items: center;
          padding: 8px 16px;
        }
        .mock-list-head {
          position: sticky;
          top: 0;
          z-index: 2;
          background: ${PALETTE.bg};
          border-bottom: 1px solid ${PALETTE.rule};
        }
        .mock-list-row {
          width: 100%;
          border: 0;
          border-bottom: 1px solid ${PALETTE.ruleSoft};
          background: transparent;
          color: ${PALETTE.ink};
          text-align: left;
          cursor: pointer;
        }
        .mock-list-row:hover {
          background: ${PALETTE.bg};
        }
        .mock-list-row.selected {
          background: ${PALETTE.peachBg};
          box-shadow: inset 3px 0 0 ${PALETTE.peach};
        }
        .mock-visual {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          background: #f5f3ee;
          overflow: hidden;
        }
        .mock-visual.thumb {
          width: 44px;
          height: 52px;
          aspect-ratio: auto;
          border: 1px solid ${PALETTE.rule};
          border-radius: 3px;
        }
        .mock-visual-img {
          object-fit: contain;
        }
        .mock-fallback-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .mock-row-code {
          display: grid;
          gap: 3px;
        }
        .mock-row-code > span {
          color: ${PALETTE.inkLight};
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mock-row-code em {
          width: fit-content;
          border-radius: 999px;
          background: ${PALETTE.peachBg};
          color: ${PALETTE.peach};
          padding: 2px 6px;
          font-size: 10px;
          font-style: normal;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .mock-truncate {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: ${PALETTE.inkSoft};
          font-size: 12px;
        }
        .mock-status {
          width: fit-content;
          max-width: 100%;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .mock-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .mock-status.empty {
          padding-left: 0;
          background: transparent;
          color: ${PALETTE.inkLight};
          font-weight: 500;
        }
        .mock-decision-buttons {
          display: flex;
          gap: 4px;
        }
        .mock-decision-buttons button {
          width: 28px;
          height: 26px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 4px;
          background: ${PALETTE.panel};
          color: ${PALETTE.inkSoft};
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }
        .mock-gallery {
          flex: 1;
          overflow: auto;
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          align-content: start;
          gap: 12px;
        }
        .mock-gallery-card {
          border: 1px solid ${PALETTE.rule};
          border-radius: 6px;
          overflow: hidden;
          background: ${PALETTE.panel};
          color: ${PALETTE.ink};
          text-align: left;
          cursor: pointer;
        }
        .mock-gallery-card.selected {
          border-color: ${PALETTE.peach};
          box-shadow: 0 0 0 3px ${PALETTE.peachBg};
        }
        .mock-gallery-body {
          padding: 10px 11px;
          border-top: 1px solid ${PALETTE.ruleSoft};
        }
        .mock-gallery-title, .mock-gallery-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .mock-gallery-body p {
          min-height: 34px;
          margin: 5px 0 10px;
          color: ${PALETTE.inkSoft};
          font-size: 11px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .mock-detail {
          width: 420px;
          flex-shrink: 0;
          border-left: 1px solid ${PALETTE.rule};
          background: ${PALETTE.panel};
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .mock-detail-nav {
          height: 42px;
          padding: 0 14px;
          border-bottom: 1px solid ${PALETTE.rule};
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${PALETTE.bg};
        }
        .mock-detail-nav div {
          display: flex;
          gap: 6px;
        }
        .mock-detail-nav button {
          width: 26px;
          height: 26px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${PALETTE.panel};
          color: ${PALETTE.inkSoft};
          cursor: pointer;
        }
        .mock-detail-hero {
          height: 300px;
          background: #f5f3ee;
          border-bottom: 1px solid ${PALETTE.ruleSoft};
        }
        .mock-detail-hero .mock-visual {
          height: 100%;
          aspect-ratio: auto;
        }
        .mock-fabric-texture {
          width: 100%;
          height: 100%;
          box-shadow: inset 0 0 70px rgba(26,24,21,.2);
        }
        .mock-detail-closeup {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .mock-detail-closeup .mock-fabric-texture {
          position: absolute;
          inset: 0;
          transform: scale(1.05);
        }
        .mock-detail-closeup div:nth-child(2) {
          position: absolute;
          left: 0;
          right: 0;
          top: 88px;
          height: 24px;
          border-top: 1px solid rgba(26,24,21,.35);
          border-bottom: 1px solid rgba(26,24,21,.25);
          background: rgba(255,255,255,.2);
        }
        .mock-detail-closeup span {
          position: absolute;
          left: 14px;
          bottom: 12px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(26,24,21,.72);
          color: #fff;
          font-size: 11px;
        }
        .mock-thumb-tabs {
          padding: 8px 14px;
          border-bottom: 1px solid ${PALETTE.rule};
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: ${PALETTE.bg};
        }
        .mock-thumb-tabs button {
          height: 30px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 4px;
          background: ${PALETTE.panel};
          color: ${PALETTE.inkSoft};
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .mock-thumb-tabs button.active {
          border-color: ${PALETTE.ink};
          color: ${PALETTE.ink};
          box-shadow: 0 0 0 2px ${PALETTE.peachBg};
        }
        .mock-detail-scroll {
          flex: 1;
          overflow: auto;
        }
        .mock-detail-section {
          padding: 15px 16px;
          border-bottom: 1px solid ${PALETTE.rule};
        }
        .mock-detail-section h2 {
          margin: 4px 0 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 19px;
          line-height: 1.2;
        }
        .mock-detail-section p {
          margin: 0;
          color: ${PALETTE.inkSoft};
          font-size: 12px;
          line-height: 1.5;
        }
        .mock-meta-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 104px 1fr;
          gap: 7px 10px;
          font-size: 12px;
        }
        .mock-detail-price {
          margin-top: 10px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 6px;
          background: ${PALETTE.peachBg};
          padding: 8px 10px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .mock-detail-price span {
          color: ${PALETTE.peach};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .mock-detail-price b {
          color: ${PALETTE.ink};
          font-size: 18px;
          font-variant-numeric: tabular-nums;
        }
        .mock-meta-grid span {
          color: ${PALETTE.inkLight};
        }
        .mock-meta-grid b {
          color: ${PALETTE.ink};
          font-weight: 600;
        }
        .mock-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .mock-section-header span:last-child {
          color: ${PALETTE.inkLight};
          font-size: 11px;
        }
        .mock-fabric-list {
          display: grid;
          gap: 10px;
        }
        .mock-fabric-card {
          border: 1px solid ${PALETTE.rule};
          border-radius: 6px;
          padding: 10px;
          background: ${PALETTE.bg};
        }
        .mock-fabric-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 5px;
        }
        .mock-fabric-card-head b {
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }
        .mock-fabric-card-head span {
          border-radius: 4px;
          background: ${PALETTE.peachBg};
          color: ${PALETTE.peach};
          padding: 2px 5px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .mock-fabric-card small {
          display: block;
          margin-top: 5px;
          color: ${PALETTE.inkLight};
          font-size: 11px;
          line-height: 1.4;
        }
        .mock-price-line {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid ${PALETTE.rule};
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .mock-price-line span {
          color: ${PALETTE.inkLight};
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .mock-price-line b {
          color: ${PALETTE.ink};
          font-size: 18px;
          font-variant-numeric: tabular-nums;
        }
        .mock-empty-copy {
          color: ${PALETTE.inkLight} !important;
          font-style: italic;
        }
        .mock-decision-stack {
          margin-top: 8px;
          display: grid;
          gap: 6px;
        }
        .mock-decision-stack button {
          min-height: 38px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          background: ${PALETTE.panel};
          color: ${PALETTE.ink};
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          cursor: pointer;
        }
        .mock-decision-stack button span:first-child {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        .mock-decision-stack i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .mock-detail-section textarea {
          width: 100%;
          margin-top: 8px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 5px;
          background: ${PALETTE.panel};
          color: ${PALETTE.ink};
          padding: 10px;
          resize: vertical;
          outline: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        @media (max-width: 1180px) {
          .mock-list-head,
          .mock-list-row {
            grid-template-columns: 36px 54px 120px minmax(160px, 1fr) 84px minmax(110px, 140px) 70px 86px;
          }
          .mock-list-head > :last-child,
          .mock-list-row > :last-child {
            display: none;
          }
          .mock-detail {
            width: 380px;
          }
        }
        @media (max-width: 940px) {
          .mock-topbar {
            height: auto;
            min-height: 46px;
            grid-template-columns: 1fr;
            padding: 10px 12px;
          }
          .mock-actions {
            justify-content: flex-start;
            overflow-x: auto;
          }
          .mock-sidebar {
            display: none;
          }
          .mock-body {
            display: block;
            overflow: auto;
          }
          .mock-content {
            min-height: 620px;
          }
          .mock-content-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .mock-review-note {
            text-align: left;
          }
          .mock-list {
            overflow-x: auto;
          }
          .mock-list-head,
          .mock-list-row {
            min-width: 980px;
          }
          .mock-detail {
            width: 100%;
            max-height: none;
            border-left: 0;
            border-top: 1px solid ${PALETTE.rule};
          }
        }
        @media (max-width: 560px) {
          .mock-segmented span,
          .mock-upload {
            font-size: 11px;
          }
          .mock-upload {
            padding: 0 8px;
          }
          .mock-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 10px;
            gap: 10px;
          }
          .mock-gallery-actions {
            align-items: flex-start;
            flex-direction: column;
          }
          .mock-detail-hero {
            height: 250px;
          }
        }
      `}</style>

      <div className="mock-page">
        <div className="mock-shell">
          <TopBar
            search={search}
            setSearch={setSearch}
            view={view}
            setView={setView}
            total={styles.length}
            dataSource={dataSource}
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
                  decisions={decisions}
                  selectedId={selectedStyle?.id ?? null}
                  onSelectStyle={setSelectedId}
                  onDecision={handleDecision}
                />
              ) : (
                <GalleryView
                  styles={visibleStyles}
                  decisions={decisions}
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
