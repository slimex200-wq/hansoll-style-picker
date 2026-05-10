"use client";

import Image from "next/image";
import { useState } from "react";
import type { Style } from "@/lib/types";

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

export default function StyleVisual({
  style,
  className = "",
}: {
  style: Style;
  className?: string;
}) {
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
