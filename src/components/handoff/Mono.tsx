"use client";

import type { ReactNode } from "react";

export default function Mono({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return <span className={muted ? "mock-mono mock-muted" : "mock-mono"}>{children}</span>;
}
