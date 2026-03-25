"use client";

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
      className="bg-white rounded-xl overflow-hidden border border-[#eee] cursor-pointer transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-left w-full min-h-[44px]"
      aria-label={`View details for style ${style.id}`}
    >
      <div className="relative w-full aspect-[3/4] bg-[#f0f0f0]">
        {style.image_url ? (
          <img
            src={style.image_url}
            alt={`Style ${style.id}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#aaa] text-xs">
            {style.id}
          </div>
        )}
        {status && (
          <span
            className={`absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].text}`}
          >
            {STATUS_CONFIG[status].label}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-[13px] font-semibold text-[#333]">{style.id}</div>
        <div className="text-[11px] text-[#888] mt-1 leading-relaxed">
          {style.contents} &middot; {style.construction} &middot; {style.weight}
        </div>
        {memoCount > 0 && (
          <div className="text-[11px] text-[#E85D2A] mt-1.5">
            {memoCount} memo{memoCount > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </button>
  );
}
