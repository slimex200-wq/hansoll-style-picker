"use client";

import Image from "next/image";
import type { Style, SelectionStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/store";

interface StyleCardProps {
  style: Style;
  status: SelectionStatus | null;
  memoCount: number;
  onClick: () => void;
}

export default function StyleCard({
  style,
  status,
  memoCount,
  onClick,
}: StyleCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "left" as const,
        width: "100%",
        minHeight: 44,
        transition: "box-shadow 0.15s",
        position: "relative" as const,
      }}
      className="hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      aria-label={`View details for style ${style.id}`}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "#F0EEEB" }}>
        {style.image_url ? (
          <Image
            src={style.image_url}
            alt={`Style ${style.id}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
            {style.id}
          </div>
        )}
        {status && (
          <span
            className={`absolute top-2 right-2 ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].text}`}
            style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 600 }}
          >
            {STATUS_CONFIG[status].label}
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{style.id}</div>
        <div className="card-meta-text" style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
          {style.contents} &middot; {style.construction} &middot; {style.weight}
        </div>
        {memoCount > 0 && (
          <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
            {memoCount} memo{memoCount > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </button>
  );
}
