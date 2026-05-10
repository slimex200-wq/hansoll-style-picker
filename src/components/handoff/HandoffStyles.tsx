"use client";

// Three <style> tags keep each source module under the 800-line ceiling
// while still emitting the same CSS the handoff layout depends on.
// Shell rules live in handoff-shell-css.ts, list/gallery/detail rules
// live in handoff-view-css.ts, and modal/lightbox/responsive rules live
// in handoff-modal-css.ts.
import { HANDOFF_SHELL_CSS } from "./handoff-shell-css";
import { HANDOFF_VIEW_CSS } from "./handoff-view-css";
import { HANDOFF_MODAL_CSS } from "./handoff-modal-css";

export default function HandoffStyles() {
  return (
    <>
      <style>{HANDOFF_SHELL_CSS}</style>
      <style>{HANDOFF_VIEW_CSS}</style>
      <style>{HANDOFF_MODAL_CSS}</style>
    </>
  );
}
