"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HandoffStyles from "@/components/handoff/HandoffStyles";
import Mono from "@/components/handoff/Mono";
import ToastContainer, { showToast } from "@/components/Toast";
import { PALETTE } from "@/components/handoff/palette";

interface CollectionSummary {
  collection: string;
  styles: number;
  selections: number;
  memos: number;
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CollectionSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/collections", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
      setRows(json.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/collections/${encodeURIComponent(pendingDelete.collection)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
      const { selections, memos, styles } = json.data.deleted;
      showToast(
        `Deleted ${pendingDelete.collection}: ${styles} styles · ${selections} selections · ${memos} memos`,
        "success"
      );
      setPendingDelete(null);
      await load();
    } catch (e) {
      showToast(`Delete failed: ${(e as Error).message}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <HandoffStyles />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div>
            <Mono muted>Admin</Mono>
            <h1 style={titleStyle}>Collections</h1>
            <p style={subStyle}>
              Per-collection style + review counts. Use Delete to wipe a stale season —
              this removes styles, selections, and memos for that collection in one go.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" style={linkStyle}>← Back to summary</Link>
            <Link href="/admin/upload" style={linkStyle}>Upload data</Link>
          </div>
        </header>

        <main style={tableWrap}>
          {loading ? (
            <p style={emptyStyle}>Loading…</p>
          ) : error ? (
            <div style={errorStyle}>{error}</div>
          ) : rows.length === 0 ? (
            <p style={emptyStyle}>No collections found.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Collection</th>
                  <th style={thNumStyle}>Styles</th>
                  <th style={thNumStyle}>Selections</th>
                  <th style={thNumStyle}>Memos</th>
                  <th style={thStyle} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.collection}>
                    <td style={tdStyle}>
                      <Mono>{row.collection}</Mono>
                    </td>
                    <td style={tdNumStyle}>{row.styles}</td>
                    <td style={tdNumStyle}>{row.selections}</td>
                    <td style={tdNumStyle}>{row.memos}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(row)}
                        style={dangerBtn}
                        disabled={row.styles === 0 && row.selections === 0 && row.memos === 0}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Delete collection ${pendingDelete.collection}`}
          style={overlayStyle}
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Delete this collection?</h2>
            <p style={modalBodyStyle}>
              <b>{pendingDelete.collection}</b> will be permanently deleted along with all
              reviewer data tied to it:
            </p>
            <ul style={listStyle}>
              <li><b>{pendingDelete.styles}</b> styles</li>
              <li><b>{pendingDelete.selections}</b> selections (reviewer picks)</li>
              <li><b>{pendingDelete.memos}</b> memos</li>
            </ul>
            <p style={warnStyle}>
              This action cannot be undone. Storage objects (style images) are NOT removed
              automatically and can be cleaned later from Supabase Storage if needed.
            </p>
            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                style={secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={dangerBtn}
              >
                {deleting ? "Deleting…" : "Delete collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: PALETTE.bg,
  padding: 20,
  fontFamily: "inherit",
  color: PALETTE.ink,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  margin: "6px 0 4px",
  fontSize: 22,
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
};

const subStyle: React.CSSProperties = {
  margin: 0,
  color: PALETTE.inkSoft,
  fontSize: 13,
  maxWidth: 640,
};

const linkStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: `1px solid ${PALETTE.rule}`,
  borderRadius: 5,
  fontSize: 13,
  textDecoration: "none",
  color: PALETTE.ink,
  background: PALETTE.panel,
};

const tableWrap: React.CSSProperties = {
  background: PALETTE.panel,
  border: `1px solid ${PALETTE.rule}`,
  borderRadius: 8,
  overflow: "hidden",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  borderBottom: `1px solid ${PALETTE.rule}`,
  background: PALETTE.bg,
  fontSize: 11,
  color: PALETTE.inkLight,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const thNumStyle: React.CSSProperties = { ...thStyle, textAlign: "right", width: 100 };
const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: `1px solid ${PALETTE.ruleSoft}`,
  verticalAlign: "middle",
};
const tdNumStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const emptyStyle: React.CSSProperties = {
  padding: 28,
  textAlign: "center",
  color: PALETTE.inkLight,
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  padding: 14,
  margin: 14,
  color: "#b3261e",
  background: "#fde7e7",
  borderRadius: 4,
  fontSize: 13,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(20, 18, 14, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: PALETTE.panel,
  borderRadius: 10,
  width: "min(520px, 100%)",
  border: `1px solid ${PALETTE.rule}`,
  boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  padding: 22,
};

const modalTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 17,
  color: PALETTE.ink,
};

const modalBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: PALETTE.inkSoft,
  lineHeight: 1.5,
};

const listStyle: React.CSSProperties = {
  margin: "10px 0",
  padding: "0 0 0 18px",
  fontSize: 13,
  color: PALETTE.ink,
  lineHeight: 1.7,
};

const warnStyle: React.CSSProperties = {
  margin: "10px 0 0",
  padding: 10,
  background: PALETTE.peachBg,
  color: PALETTE.peach,
  borderRadius: 5,
  fontSize: 12,
};

const modalActionsStyle: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  color: PALETTE.ink,
  border: `1px solid ${PALETTE.rule}`,
  borderRadius: 4,
  fontSize: 13,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#b3261e",
  color: "#fff",
  border: 0,
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
