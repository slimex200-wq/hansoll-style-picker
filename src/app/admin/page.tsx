"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Memo, Selection, SelectionStatus, Style } from "@/lib/types";
import { fetchMemos, fetchSelections, fetchStyles } from "@/lib/api";
import HandoffStyles from "@/components/handoff/HandoffStyles";
import Mono from "@/components/handoff/Mono";
import StyleImageUploader from "@/components/admin/StyleImageUploader";
import ToastContainer, { showToast } from "@/components/Toast";
import { useIsMobile } from "@/lib/use-is-mobile";
import {
  PALETTE,
  STATUS_META,
  getCollectionLabel,
} from "@/components/handoff/palette";

type AdminFilter = "all" | "reviewed" | "unreviewed";

export default function AdminPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDivision, setActiveDivision] = useState<string>("");
  const [filter, setFilter] = useState<AdminFilter>("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!(isMobile && mobileSidebarOpen)) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, mobileSidebarOpen]);

  useEffect(() => {
    async function load() {
      try {
        const [s, sel, m] = await Promise.all([fetchStyles(), fetchSelections(), fetchMemos()]);
        setStyles(s);
        setSelections(sel);
        setMemos(m);
        setLoadError(null);
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getVotesForStyle = (styleId: string) => {
    const votes = selections.filter((s) => s.style_id === styleId);
    const counts = { shortlist: 0, maybe: 0, pass: 0 };
    for (const v of votes) counts[v.status]++;
    return { votes, counts, total: votes.length };
  };

  const getLatestMemo = (styleId: string): Memo | undefined =>
    memos.reduce<Memo | undefined>((latest, m) => {
      if (m.style_id !== styleId) return latest;
      if (!latest) return m;
      return new Date(m.created_at) > new Date(latest.created_at) ? m : latest;
    }, undefined);

  const uniqueUsers = useMemo(() => new Set(selections.map((s) => s.user_id)).size, [selections]);
  const divisions = useMemo(() => [...new Set(styles.map((s) => s.division))], [styles]);
  const currentDivision = activeDivision && divisions.includes(activeDivision) ? activeDivision : divisions[0] ?? "";

  const reviewedStyleIds = useMemo(() => new Set(selections.map((s) => s.style_id)), [selections]);

  const filteredStyles = useMemo(() => {
    return styles
      .filter((s) => (currentDivision ? s.division === currentDivision : true))
      .filter((s) => {
        if (filter === "reviewed") return reviewedStyleIds.has(s.id);
        if (filter === "unreviewed") return !reviewedStyleIds.has(s.id);
        return true;
      });
  }, [currentDivision, filter, reviewedStyleIds, styles]);

  const collectionLabel = useMemo(() => getCollectionLabel(styles), [styles]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: PALETTE.bg }}>
        <p style={{ color: PALETTE.inkLight, fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 460, background: PALETTE.panel, border: `1px solid ${PALETTE.rule}`, borderRadius: 8, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: PALETTE.ink }}>Data connection unavailable</h2>
          <p style={{ margin: 0, color: PALETTE.inkSoft, fontSize: 13, lineHeight: 1.5 }}>{loadError}</p>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <Link
              href="/admin/upload"
              style={{ padding: "10px 14px", background: PALETTE.peach, color: "#fff", borderRadius: 5, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
            >
              Go to Upload Data
            </Link>
            <Link
              href="/"
              style={{ padding: "10px 14px", border: `1px solid ${PALETTE.rule}`, color: PALETTE.ink, borderRadius: 5, textDecoration: "none", fontSize: 13 }}
            >
              Back to picker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <HandoffStyles />

      <div className="mock-page">
        <div className="mock-shell">
          <header className="mock-topbar">
            <div className="mock-top-left">
              {isMobile && (
                <button
                  type="button"
                  className="mock-mobile-menu-button"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={16} />
                </button>
              )}
              <Mono muted>Admin</Mono>
              <span className="mock-dot-separator" />
              <Mono>{styles.length} styles</Mono>
              <Mono muted>{uniqueUsers} reviewer{uniqueUsers !== 1 ? "s" : ""}</Mono>
            </div>
            <div />
            <div className="mock-actions">
              <Link className="mock-upload" href="/admin/upload">
                Upload Data
              </Link>
              <Link className="mock-upload" href="/" style={{ background: PALETTE.peach, color: "#fff", borderColor: PALETTE.peach }}>
                Back to picker
              </Link>
            </div>
          </header>

          <div className="mock-body">
            {isMobile && mobileSidebarOpen && (
              <div
                className="mock-sidebar-backdrop"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
            <aside
              className={`mock-sidebar${isMobile && mobileSidebarOpen ? " mobile-open" : ""}`}
              aria-hidden={isMobile ? !mobileSidebarOpen : undefined}
            >
              <div className="mock-sidebar-block mock-sidebar-head">
                <div>
                  <Mono muted>Workspace</Mono>
                  <div className="mock-brand-mark">
                    <span>H</span>
                    HANSOLL {collectionLabel}
                  </div>
                </div>
                {isMobile && (
                  <button
                    type="button"
                    className="mock-sidebar-close"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="mock-sidebar-block">
                <Mono muted>Reviewers</Mono>
                <div className="mock-progress-title">
                  <span>Talbots Outlet</span>
                  <Mono>{uniqueUsers}</Mono>
                </div>
                <div className="mock-progress-meta">
                  <Mono muted>{reviewedStyleIds.size}/{styles.length} reviewed</Mono>
                </div>
              </div>

              {divisions.length > 0 && (
                <div className="mock-sidebar-block">
                  <Mono muted>Division</Mono>
                  <div className="mock-menu">
                    {divisions.map((division) => (
                      <button
                        key={division}
                        className={division === currentDivision ? "active" : ""}
                        onClick={() => {
                          setActiveDivision(division);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <span>{division}</span>
                        <Mono muted>{styles.filter((s) => s.division === division).length}</Mono>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mock-sidebar-block mock-sidebar-grow">
                <Mono muted>Filter</Mono>
                <div className="mock-menu">
                  {([
                    { key: "all", label: "All styles", count: styles.length },
                    { key: "reviewed", label: "Reviewed", count: reviewedStyleIds.size },
                    { key: "unreviewed", label: "Unreviewed", count: styles.length - reviewedStyleIds.size },
                  ] as Array<{ key: AdminFilter; label: string; count: number }>).map((item) => (
                    <button
                      key={item.key}
                      className={filter === item.key ? "active" : ""}
                      onClick={() => {
                        setFilter(item.key);
                        setMobileSidebarOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      <Mono muted>{item.count}</Mono>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mock-sidebar-footer">
                <Link href="/" className="mock-sidebar-summary">
                  Back to picker
                </Link>
              </div>
            </aside>

            <main className="mock-content">
              <div className="mock-content-header">
                <div>
                  <h1>{currentDivision || "Selection summary"}</h1>
                  <p>
                    {filteredStyles.length} shown &middot; aggregate vote counts and the latest memo per style.
                  </p>
                </div>
              </div>

              <div className="admin-table">
                {filteredStyles.length === 0 ? (
                  <div style={{ padding: 64, textAlign: "center", color: PALETTE.inkLight }}>No styles to summarise.</div>
                ) : (
                  filteredStyles.map((style) => {
                    const { counts, total } = getVotesForStyle(style.id);
                    const latestMemo = getLatestMemo(style.id);
                    const handleVariantUpload = (
                      kind: "fabric" | "detail",
                      url: string
                    ) => {
                      setStyles((prev) =>
                        prev.map((s) =>
                          s.id === style.id
                            ? {
                                ...s,
                                fabric_image_url:
                                  kind === "fabric" ? url : s.fabric_image_url,
                                detail_image_url:
                                  kind === "detail" ? url : s.detail_image_url,
                              }
                            : s
                        )
                      );
                      showToast(
                        `${kind === "fabric" ? "Fabric" : "Detail"} image saved for ${style.id}`,
                        "success"
                      );
                    };
                    return (
                      <article key={style.id} className="admin-row">
                        <div className="admin-row-thumb">
                          {style.image_url ? (
                            <Image src={style.image_url} alt={style.id} fill sizes="80px" className="admin-row-img" />
                          ) : null}
                        </div>
                        <div className="admin-row-body">
                          <div className="admin-row-head">
                            <Mono>{style.id}</Mono>
                            <Mono muted>{style.division}</Mono>
                          </div>
                          <p>{style.contents}{style.construction ? ` · ${style.construction}` : ""}{style.weight ? ` · ${style.weight}` : ""}</p>
                          <div className="admin-variant-row">
                            <StyleImageUploader
                              styleId={style.id}
                              kind="fabric"
                              currentUrl={style.fabric_image_url ?? null}
                              onUploaded={(url) => handleVariantUpload("fabric", url)}
                              onError={(message) =>
                                showToast(`Fabric upload failed: ${message}`, "error")
                              }
                            />
                            <StyleImageUploader
                              styleId={style.id}
                              kind="detail"
                              currentUrl={style.detail_image_url ?? null}
                              onUploaded={(url) => handleVariantUpload("detail", url)}
                              onError={(message) =>
                                showToast(`Detail upload failed: ${message}`, "error")
                              }
                            />
                          </div>
                          {total > 0 ? (
                            <div className="admin-vote-row">
                              {(["shortlist", "maybe", "pass"] as SelectionStatus[]).map((s) =>
                                counts[s] > 0 ? (
                                  <span
                                    key={s}
                                    className="mock-status"
                                    style={{ color: STATUS_META[s].color, background: STATUS_META[s].bg }}
                                  >
                                    <span style={{ background: STATUS_META[s].color }} />
                                    {STATUS_META[s].label} {counts[s]}
                                  </span>
                                ) : null
                              )}
                            </div>
                          ) : (
                            <p className="mock-empty-copy">No votes yet</p>
                          )}
                          {latestMemo && (
                            <p className="admin-latest-memo">
                              <b>{latestMemo.user_name}:</b> {latestMemo.content}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      <style>{`
        .admin-table {
          padding: 16px;
          display: grid;
          gap: 12px;
        }
        .admin-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 14px;
          padding: 12px;
          border: 1px solid ${PALETTE.rule};
          border-radius: 8px;
          background: ${PALETTE.panel};
        }
        .admin-row-thumb {
          width: 80px;
          height: 100px;
          position: relative;
          background: ${PALETTE.bg};
          border: 1px solid ${PALETTE.ruleSoft};
          border-radius: 4px;
          overflow: hidden;
        }
        .admin-row-img {
          object-fit: cover;
        }
        .admin-row-body {
          display: grid;
          gap: 4px;
        }
        .admin-row-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .admin-row-body p {
          margin: 0;
          color: ${PALETTE.inkSoft};
          font-size: 12px;
          line-height: 1.5;
        }
        .admin-vote-row {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .admin-latest-memo {
          margin-top: 4px !important;
          padding-top: 6px;
          border-top: 1px solid ${PALETTE.ruleSoft};
          color: ${PALETTE.inkSoft};
          font-size: 12px;
        }
        .admin-latest-memo b {
          color: ${PALETTE.peach};
        }
        .admin-variant-row {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .style-img-uploader {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px 4px 4px;
          border: 1px dashed ${PALETTE.rule};
          border-radius: 6px;
          background: ${PALETTE.bg};
          color: ${PALETTE.ink};
          font-size: 11px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .style-img-uploader:hover:not([data-busy]) {
          border-color: ${PALETTE.peach};
          background: ${PALETTE.panel};
        }
        .style-img-uploader[data-busy] {
          opacity: 0.6;
          cursor: wait;
        }
        .style-img-uploader:focus-visible {
          outline: 2px solid ${PALETTE.peach};
          outline-offset: 2px;
        }
        .style-img-uploader-thumb {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          background: ${PALETTE.panel};
          border: 1px solid ${PALETTE.ruleSoft};
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .style-img-uploader-thumb img {
          object-fit: cover;
        }
        .style-img-uploader-empty {
          color: ${PALETTE.inkLight};
          font-size: 18px;
          font-weight: 300;
        }
        .style-img-uploader-spinner {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${PALETTE.peach};
        }
        .style-img-uploader-meta {
          display: flex;
          flex-direction: column;
          gap: 0;
          line-height: 1.2;
          text-align: left;
        }
        .style-img-uploader-meta b {
          font-size: 11px;
          font-weight: 600;
          color: ${PALETTE.ink};
        }
        .style-img-uploader-meta span {
          font-size: 10px;
          color: ${PALETTE.inkLight};
        }
      `}</style>
      <ToastContainer />
    </>
  );
}
