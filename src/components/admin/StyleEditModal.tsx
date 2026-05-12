"use client";

import { useEffect, useState } from "react";
import type { FabricDetail } from "@/lib/fabric-details";
import type { Style, StyleSpecOverride } from "@/lib/types";
import { PALETTE } from "@/components/handoff/palette";

/** Spec fields shown in the top section. `fabric_no` is also written into the
 *  matched-fabric override as `fabricCode` so the matched card stays in sync. */
type SpecKey = "contents" | "construction" | "weight" | "fabric_no" | "division" | "designed_by";

/** Matched-fabric extras. `content` / `construction` / `weightGm2` /
 *  `fabricCode` are intentionally NOT here — they cascade from the spec
 *  section automatically (see attachFabricDetailsFromRows specSeedForFabric). */
type FabricKey =
  | "supplier" | "widthInch" | "priceYd" | "priceLb"
  | "finish" | "yarnDetail" | "comment" | "fabricCountry"
  | "originalText" | "sourceSheet" | "pattern" | "option";

const SPEC_FIELDS: Array<{ key: SpecKey; label: string; placeholder?: string }> = [
  { key: "contents",     label: "Content",        placeholder: "95/5 COTTON/SPANDEX" },
  { key: "construction", label: "Construction",   placeholder: "Single Jersey" },
  { key: "weight",       label: "Weight",         placeholder: "150 G/M2" },
  { key: "fabric_no",    label: "Fabric code",    placeholder: "WL0113-21" },
  { key: "division",     label: "Division",       placeholder: "Knit Top" },
  { key: "designed_by",  label: "Designed by",    placeholder: "Hansoll" },
];

const FABRIC_FIELDS: Array<{ key: FabricKey; label: string; placeholder?: string; group: "core" | "extra" }> = [
  { key: "supplier",      label: "Supplier",                                       group: "core" },
  { key: "widthInch",     label: "Width (inch)",   placeholder: "55/57",           group: "core" },
  { key: "priceYd",       label: "Price ($/YD)",   placeholder: "3.31",            group: "core" },
  { key: "priceLb",       label: "Price ($/LB)",   placeholder: "4.74",            group: "core" },
  { key: "finish",        label: "Finish",                                         group: "core" },
  { key: "fabricCountry", label: "Fabric CO",                                      group: "core" },
  { key: "yarnDetail",    label: "Yarn detail",                                    group: "extra" },
  { key: "comment",       label: "Comment",                                        group: "extra" },
  { key: "originalText",  label: "Original FL text",                               group: "extra" },
  { key: "sourceSheet",   label: "Source sheet",                                   group: "extra" },
  { key: "pattern",       label: "Pattern #",                                      group: "extra" },
  { key: "option",        label: "Option",                                         group: "extra" },
];

type SpecForm = Partial<Record<SpecKey, string>>;
type FabricForm = Partial<Record<FabricKey, string>>;

interface Props {
  style: Style;
  onClose: () => void;
  onSaved: (next: { spec: StyleSpecOverride | null; fabric: Partial<FabricDetail> | null }) => void;
}

export default function StyleEditModal({ style, onClose, onSaved }: Props) {
  const [spec, setSpec] = useState<SpecForm>(() => initialSpecForm(style));
  const [fabric, setFabric] = useState<FabricForm>(() => initialFabricForm(style));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSpec(initialSpecForm(style));
    setFabric(initialFabricForm(style));
  }, [style]);

  const setSpecField = (key: SpecKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSpec((prev) => ({ ...prev, [key]: e.target.value }));

  const setFabricField = (key: FabricKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFabric((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (clear = false) => {
    setSaving(true);
    setError(null);
    try {
      // Build payloads. `fabric_no` from the spec section also lands in
      // fabric_override as `fabricCode` so the matched card carries the
      // corrected code without a second input.
      const specPayload = clear ? null : trimmedSubset(spec);
      const fabricPayload = clear ? null : buildFabricOverride(spec, fabric);

      const [specRes, fabricRes] = await Promise.all([
        fetch(`/api/styles/${encodeURIComponent(style.id)}/spec`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ override: specPayload }),
        }),
        fetch(`/api/styles/${encodeURIComponent(style.id)}/fabric`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ override: fabricPayload }),
        }),
      ]);

      if (!specRes.ok) {
        const json = await specRes.json().catch(() => ({}));
        throw new Error(json.error ?? `Spec save failed: ${specRes.status}`);
      }
      if (!fabricRes.ok) {
        const json = await fabricRes.json().catch(() => ({}));
        throw new Error(json.error ?? `Fabric save failed: ${fabricRes.status}`);
      }

      onSaved({ spec: specPayload as StyleSpecOverride | null, fabric: fabricPayload });
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
      aria-label={`Edit style ${style.id}`}
      style={overlayStyle}
      onClick={onClose}
    >
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <strong style={{ color: PALETTE.ink, fontSize: 15 }}>Edit style — {style.id}</strong>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </header>

        <div style={bodyStyle}>
          <p style={{ margin: 0, fontSize: 12, color: PALETTE.inkSoft }}>
            Spec fields here override the PDF parse. Content / construction / weight / fabric code
            also flow into the matched-fabric card automatically. Use <b>Clear override</b> to
            restore the original parse and workbook mapping.
          </p>

          <section>
            <Mono>Style spec</Mono>
            <div style={gridStyle}>
              {SPEC_FIELDS.map((f) => (
                <FieldRow
                  key={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={spec[f.key] ?? ""}
                  onChange={setSpecField(f.key)}
                />
              ))}
            </div>
          </section>

          <section>
            <Mono>Matched fabric — extras</Mono>
            <div style={gridStyle}>
              {FABRIC_FIELDS.filter((f) => f.group === "core").map((f) => (
                <FieldRow
                  key={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={fabric[f.key] ?? ""}
                  onChange={setFabricField(f.key)}
                />
              ))}
            </div>
          </section>

          <section>
            <Mono>Additional</Mono>
            <div style={gridStyle}>
              {FABRIC_FIELDS.filter((f) => f.group === "extra").map((f) => (
                <FieldRow
                  key={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={fabric[f.key] ?? ""}
                  onChange={setFabricField(f.key)}
                  multiline={f.key === "comment" || f.key === "originalText"}
                />
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
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
}) {
  return (
    <label style={fieldLabelStyle}>
      <span style={{ fontSize: 11, color: PALETTE.inkSoft }}>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2} style={inputStyle} />
      ) : (
        <input value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
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

function initialSpecForm(style: Style): SpecForm {
  // Pre-fill from existing override; fall back to the raw columns so the user
  // sees what's currently displayed and edits incrementally.
  const source: Partial<Record<SpecKey, string | undefined>> = style.spec_override
    ? style.spec_override
    : {
        contents: style.contents,
        construction: style.construction,
        weight: style.weight,
        fabric_no: style.fabric_no,
        division: style.division,
        designed_by: style.designed_by,
      };
  const out: SpecForm = {};
  for (const f of SPEC_FIELDS) {
    const v = source[f.key];
    if (typeof v === "string" && v.trim()) out[f.key] = v;
  }
  return out;
}

function initialFabricForm(style: Style): FabricForm {
  // Pre-fill from existing override; fall back to the first matched fabric row
  // so users edit from the current state.
  const source: Partial<FabricDetail> | null =
    style.fabric_override ?? (style.fabric_details?.[0] ?? null);
  if (!source) return {};
  const out: FabricForm = {};
  for (const f of FABRIC_FIELDS) {
    const v = (source as Record<string, unknown>)[f.key];
    if (typeof v === "string" && v.trim()) out[f.key] = v;
  }
  return out;
}

function trimmedSubset<T extends Record<string, unknown>>(form: T): Record<string, string> | null {
  const out: Record<string, string> = {};
  let any = false;
  for (const [key, value] of Object.entries(form)) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) {
      out[key] = trimmed;
      any = true;
    }
  }
  return any ? out : null;
}

function buildFabricOverride(spec: SpecForm, fabric: FabricForm): Record<string, string> | null {
  const out: Record<string, string> = {};
  let any = false;
  // Cascade the spec fabric code into fabric_override.fabricCode so the
  // matched card shows it and the workbook mapping is fully supplanted.
  const code = spec.fabric_no?.trim();
  if (code) { out.fabricCode = code; any = true; }
  for (const [key, value] of Object.entries(fabric)) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) { out[key] = trimmed; any = true; }
  }
  return any ? out : null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(20, 18, 14, 0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100, padding: 16,
};

const panelStyle: React.CSSProperties = {
  background: PALETTE.panel, borderRadius: 10, width: "min(720px, 100%)",
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
