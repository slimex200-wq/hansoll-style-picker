"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export type StyleImageKind = "fabric" | "detail";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface Props {
  styleId: string;
  kind: StyleImageKind;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
}

export default function StyleImageUploader({
  styleId,
  kind,
  currentUrl,
  onUploaded,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("styleId", styleId);
      formData.append("kind", kind);
      formData.append("file", file);

      const res = await fetch("/api/import-style-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed");
      }
      onUploaded(data.url as string);
    } catch (err) {
      const message = (err as Error).message;
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  const label = kind === "fabric" ? "Fabric" : "Detail";
  const hasImage = Boolean(currentUrl);
  const trigger = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={busy ? -1 : 0}
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        }
      }}
      aria-disabled={busy || undefined}
      aria-label={`${hasImage ? "Replace" : "Upload"} ${label.toLowerCase()} image for ${styleId}`}
      className="style-img-uploader"
      data-busy={busy || undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleSelect}
        className="hidden"
        disabled={busy}
        tabIndex={-1}
      />
      <div className="style-img-uploader-thumb">
        {hasImage && currentUrl ? (
          <Image
            src={currentUrl}
            alt={`${styleId} ${label.toLowerCase()}`}
            fill
            sizes="56px"
            unoptimized
          />
        ) : (
          <span className="style-img-uploader-empty">+</span>
        )}
        {busy && (
          <span className="style-img-uploader-spinner">
            <Loader2 size={14} className="mock-spin" />
          </span>
        )}
      </div>
      <span className="style-img-uploader-meta">
        <b>{label}</b>
        <span>{hasImage ? "Replace" : "Upload"}</span>
      </span>
    </div>
  );
}
