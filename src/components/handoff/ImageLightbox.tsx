"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Style } from "@/lib/types";

function getImagesForStyle(style: Style): string[] {
  if (style.images && style.images.length > 0) return style.images;
  if (style.image_url) return [style.image_url];
  return [];
}

export default function ImageLightbox({
  style,
  initialIndex = 0,
  onClose,
}: {
  style: Style;
  initialIndex?: number;
  onClose: () => void;
}) {
  const images = getImagesForStyle(style);
  const total = images.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(total - 1, 0)));
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture focus origin on mount; restore on unmount.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setIndex((current) => (current - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setIndex((current) => (current + 1) % total);
  }, [total]);

  // Lightbox owns Escape/Arrow handling while open. Page-level shortcuts
  // are paused via the lightboxOpen state on the parent.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  if (total === 0) return null;
  const currentSrc = images[index] ?? images[0];

  return (
    <div
      className="mock-image-lightbox-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="mock-image-lightbox-caption"
        role="status"
        aria-live="polite"
        onClick={(event) => event.stopPropagation()}
      >
        {style.id} &middot; {index + 1} / {total}
      </div>
      <div
        className="mock-image-lightbox-stage"
        role="dialog"
        aria-modal="true"
        aria-label={`${style.id} garment images`}
        onClick={(event) => event.stopPropagation()}
      >
        {total > 1 && (
          <button
            type="button"
            className="mock-image-lightbox-arrow prev"
            aria-label="Previous image"
            onClick={goPrev}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="mock-image-lightbox-image-wrap">
          <img
            key={currentSrc}
            src={currentSrc}
            alt={`${style.id} image ${index + 1}`}
            className="mock-image-lightbox-image"
          />
          <button
            type="button"
            className="mock-image-lightbox-close"
            aria-label="Close lightbox"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <X size={16} />
          </button>
        </div>
        {total > 1 && (
          <button
            type="button"
            className="mock-image-lightbox-arrow next"
            aria-label="Next image"
            onClick={goNext}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div
          className="mock-image-lightbox-strip"
          onClick={(event) => event.stopPropagation()}
        >
          {images.map((src, thumbIndex) => (
            <button
              key={`${src}-${thumbIndex}`}
              type="button"
              className={
                thumbIndex === index
                  ? "mock-image-lightbox-thumb active"
                  : "mock-image-lightbox-thumb"
              }
              aria-label={`View image ${thumbIndex + 1}`}
              onClick={() => setIndex(thumbIndex)}
              style={{ position: "relative" }}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                sizes="60px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
