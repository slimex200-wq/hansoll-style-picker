"use client";

import type { Style } from "@/lib/types";
import { getPrimaryFabric } from "./palette";

export default function FabricTexture({ style }: { style: Style }) {
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
