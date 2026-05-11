"use client";

import { useEffect, useState } from "react";
import type { FabricDetail } from "@/lib/fabric-details";
import { PALETTE } from "@/components/handoff/palette";

type EditableKey =
  | "fabricCode" | "supplier" | "construction" | "content"
  | "widthInch" | "weightGm2" | "priceYd" | "priceLb"
  | "finish" | "yarnDetail" | "comment" | "fabricCountry"
  | "originalText" | "sourceSheet" | "pattern" | "option";

const FIELDS: Array<{ key: EditableKey; label: string; placeholder?: string; group: "core" | "extra" }> = [
  { key: "fabricCode",     label: "FL # / Code",      placeholder: "FL25102386",                group: "core" },
  { key: "supplier",       label: "Supplier",                                                   group: "core" },
  { key: "construction",   label: "Construction",     placeholder: "2*2 Rib",                   group: "core" },
  { key: "content",        label: "Content",          placeholder: "95/5 COTTON/SPANDEX",       group: "core" },
  { key: "widthInch",      label: "Width (inch)",     placeholder: "55/57",                     group: "core" },
  { key: "weightGm2",      label: "Weight (g/m²)",    placeholder: "225",                       group: "core" },
  { key: "priceYd",        label: "Price ($/YD)",     placeholder: "3.31",                      group: "core" },
  { key: "priceLb",        label: "Price ($/LB)",     placeholder: "4.74",                      group: "core" },
  { key: "finish",         label: "Finish",                                                     group: "extra" },
  { key: "yarnDetail",     label: "Yarn Detail",                                                group: "extra" },
  { key: "comment",        label: "Comment",                                                    group: "extra" },
  { key: "fabricCountry",  label: "Fabric CO",                                                  group: "extra" },
  { key: "originalText",   label: "Original FL Text",                                           group: "extra" },
  { key: "sourceSheet",    label: "Source Sheet",                                               group: "extra" },
  { key: "pattern",        label: "Pattern #",                                                  group: "extra" },
  { key: "option",         label: "Option",                                                     group: "extra" },
];

type FormState = Partial<Record<EditableKey, string>>;

interface Props {
  styleId: string;
  initial: Partial<FabricDetail> | null;
  onClose: () => void;
  onSaved: (override: Partial<FabricDetail> | null) => void;
}

export default function FabricEditModal({ styleId, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => initialFormFrom(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialFormFrom(initial));
  }, [initial]);

  const set = (key: EditableKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (clear = false) => {
    setSaving(true);
    setError(null);
    try {
      const override = clear ? null : trimmedSubset(form);
      const res = await fetch(`/api/styles/${encodeURIComponent(styleId)}/fabric`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
      onSaved(override);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit fabric for ${styleId}`}
      style={overlayStyle}
      onClick={onClose}
    >
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <strong style={{ color: PALETTE.ink, fontSize: 15 }}>Edit fabric — {styleId}</strong>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </header>

        <div style={bodyStyle}>
          <p style={{ margin: 0, fontSize: 12, color: PALETTE.inkSoft }}>
            Saving overrides the workbook mapping for this style only. Leave all fields blank and
            press <b>Clear override</b> to fall back to the workbook again.
          </p>

          <section>
            <Mono>Core</Mono>
            <div style={gridStyle}>
              {FIELDS.filter((f) => f.group === "core").map((f) => (
                <FieldRow key={f.key} field={f} value={form[f.key] ?? ""} onChange={set(f.key)} />
              ))}
            </div>
          </section>

          <section>
            <Mono>Additional</Mono>
            <div style={gridStyle}>
              {FIELDS.filter((f) => f.group === "extra").map((f) => (
                <FieldRow key={f.key} field={f} value={form[f.key] ?? ""} onChange={set(f.key)} />
              ))}
            </div>
          </section>

          {error && (
            <div style={{ color: "#b3261e", fontSize: 12, padding: 8, background: "#fde7e7", borderRadius: 4 }}>
              {error}
            </div>
          )}
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            style={{ ...secondaryBtn, color: PALETTE.peach, borderColor: PALETTE.peach }}
          >
            Clear override
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} disabled={saving} style={secondaryBtn}>
            Cancel
          </button>
          <button type="button" onClick={() => save(false)} disabled={saving} style={primaryBtn}>
            {saving ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: typeof FIELDS[number];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const isLong = field.key === "comment" || field.key === "originalText";
  return (
    <label style={fieldLabelStyle}>
      <span style={{ fontSize: 11, color: PALETTE.inkSoft }}>{field.label}</span>
      {isLong ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          rows={2}
          style={inputStyle}
        />
      ) : (
        <input value={value} onChange={onChange} placeholder={field.placeholder} style={inputStyle} />
      )}
    </label>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: PALETTE.inkLight,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function initialFormFrom(initial: Partial<FabricDetail> | null): FormState {
  if (!initial) return {};
  const out: FormState = {};
  for (const f of FIELDS) {
    const v = initial[f.key];
    if (typeof v === "string" && v.trim()) out[f.key] = v;
  }
  return out;
}

function trimmedSubset(form: FormState): Record<string, string> | null {
  const out: Record<string, string> = {};
  let any = false;
  for (const [key, value] of Object.entries(form)) {
    const trimmed = (value ?? "").trim();
    if (trimmed) {
      out[key] = trimmed;
      any = true;
    }
  }
  return any ? out : null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(20, 18, 14, 0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100, padding: 16,
};

const panelStyle: React.CSSProperties = {
  background: PALETTE.panel, borderRadius: 10, width: "min(640px, 100%)",
  maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column",
  border: `1px solid ${PALETTE.rule}`, boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
};

const headerStyle: React.CSSProperties = {
  padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
  borderBottom: `1px solid ${PALETTE.ruleSoft}`,
};

const bodyStyle: React.CSSProperties = {
  padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16,
};

const footerStyle: React.CSSProperties = {
  padding: "12px 18px", borderTop: `1px solid ${PALETTE.ruleSoft}`,
  display: "flex", alignItems: "center", gap: 8,
};

const closeBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", fontSize: 22, lineHeight: 1,
  color: PALETTE.inkLight, cursor: "pointer", padding: 0, width: 28, height: 28,
};

const gridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
};

const inputStyle: React.CSSProperties = {
  border: `1px solid ${PALETTE.rule}`, borderRadius: 4, padding: "6px 8px",
  fontSize: 13, color: PALETTE.ink, background: "#fff", fontFamily: "inherit",
  resize: "vertical",
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 14px", background: PALETTE.peach, color: "#fff",
  border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 14px", background: "transparent", color: PALETTE.ink,
  border: `1px solid ${PALETTE.rule}`, borderRadius: 4, fontSize: 13, cursor: "pointer",
};
