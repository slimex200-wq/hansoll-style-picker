"use client";

import { Grid2X2, List, Search, Upload } from "lucide-react";
import Link from "next/link";
import Mono from "./Mono";
import type { ViewMode } from "./palette";

export default function TopBar({
  search,
  setSearch,
  view,
  setView,
  total,
  dataSource,
  showDataSource = false,
  avatarInitials,
  uploadHref = "/admin/upload",
  showUpload = true,
}: {
  search: string;
  setSearch: (value: string) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  total: number;
  dataSource?: string;
  showDataSource?: boolean;
  avatarInitials: string;
  uploadHref?: string;
  showUpload?: boolean;
}) {
  return (
    <header className="mock-topbar">
      <div className="mock-top-left">
        <Mono muted>Outlet</Mono>
        <span className="mock-dot-separator" />
        <Mono>{total} styles</Mono>
        {showDataSource && dataSource && <span className="mock-source-pill">{dataSource}</span>}
      </div>
      <label className="mock-search">
        <Search size={14} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search style, fabric, supplier"
        />
        <span className="mock-kbd">/</span>
      </label>
      <div className="mock-actions">
        <div className="mock-segmented">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List size={14} />
            <span>List</span>
          </button>
          <button
            className={view === "gallery" ? "active" : ""}
            onClick={() => setView("gallery")}
            aria-label="Gallery view"
          >
            <Grid2X2 size={14} />
            <span>Gallery</span>
          </button>
        </div>
        {showUpload && (
          <Link className="mock-upload" href={uploadHref}>
            <Upload size={14} />
            Upload Data
          </Link>
        )}
        <span className="mock-avatar" aria-label="Reviewer avatar">{avatarInitials}</span>
      </div>
    </header>
  );
}
