"use client";

import { useState } from "react";

interface PreviewStyle {
  style_id: string;
  fabric_no: string;
  contents: string;
  construction: string;
  weight: string;
  finishing: string;
  designed_by: string;
  division: string;
  collection: string;
  fabric_suggestion: {
    fabric_no: string;
    construction: string;
    contents: string;
    weight: string;
  } | null;
  image_urls?: string[];
}

interface ParsePreviewProps {
  styles: PreviewStyle[];
  errors: string[];
  warnings: string[];
  onImport: (selectedIds: string[]) => void;
  onCancel: () => void;
  importing?: boolean;
}

export default function ParsePreview({
  styles,
  errors,
  warnings,
  onImport,
  onCancel,
  importing = false,
}: ParsePreviewProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(styles.map((s) => s.style_id))
  );

  const toggleAll = () => {
    if (selected.size === styles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(styles.map((s) => s.style_id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // Group by division
  const divisions = [...new Set(styles.map((s) => s.division))];

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-[13px] font-semibold text-red-700 mb-1">
            Errors ({errors.length})
          </div>
          {errors.map((err, i) => (
            <div key={i} className="text-[12px] text-red-600">{err}</div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-[13px] font-semibold text-yellow-700 mb-1">
            Warnings ({warnings.length})
          </div>
          {warnings.map((w, i) => (
            <div key={i} className="text-[12px] text-yellow-600">{w}</div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-[14px] text-[#333]">
          <span className="font-semibold">{styles.length}</span> styles found
          {" / "}
          <span className="font-semibold">{selected.size}</span> selected
        </div>
        <button
          onClick={toggleAll}
          className="text-[13px] text-[#E85D2A] hover:underline"
        >
          {selected.size === styles.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Styles by division */}
      {divisions.map((div) => {
        const divStyles = styles.filter((s) => s.division === div);
        return (
          <div key={div}>
            <div className="text-[13px] font-semibold text-[#333] mb-2">
              {div}{" "}
              <span className="font-normal text-[#888]">({divStyles.length})</span>
            </div>
            <div className="border border-[#eee] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eee]">
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left text-[#888] font-medium">Style</th>
                    <th className="p-2 text-left text-[#888] font-medium hidden sm:table-cell">Fabric</th>
                    <th className="p-2 text-left text-[#888] font-medium hidden md:table-cell">Construction</th>
                    <th className="p-2 text-left text-[#888] font-medium">Images</th>
                    <th className="p-2 text-left text-[#888] font-medium">Designed By</th>
                  </tr>
                </thead>
                <tbody>
                  {divStyles.map((style) => (
                    <tr
                      key={style.style_id}
                      className="border-b border-[#f0f0f0] hover:bg-[#fafafa]"
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(style.style_id)}
                          onChange={() => toggle(style.style_id)}
                          className="accent-[#E85D2A]"
                        />
                      </td>
                      <td className="p-2 font-medium text-[#333]">{style.style_id}</td>
                      <td className="p-2 text-[#666] hidden sm:table-cell">{style.fabric_no || "-"}</td>
                      <td className="p-2 text-[#666] hidden md:table-cell">{style.construction}</td>
                      <td className="p-2 text-[#666]">
                        {style.image_urls && style.image_urls.length > 0 ? (
                          <span className="text-green-600">{style.image_urls.length}</span>
                        ) : (
                          <span className="text-[#aaa]">0</span>
                        )}
                      </td>
                      <td className="p-2 text-[#666]">{style.designed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onImport([...selected])}
          disabled={selected.size === 0 || importing}
          className="flex-1 py-2.5 bg-[#E85D2A] text-white rounded-lg text-[14px] font-semibold disabled:opacity-40 hover:bg-[#d14e1f] transition-colors"
        >
          {importing ? "Importing..." : `Import ${selected.size} styles`}
        </button>
        <button
          onClick={onCancel}
          disabled={importing}
          className="px-4 py-2.5 border border-[#ddd] text-[#666] rounded-lg text-[14px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
