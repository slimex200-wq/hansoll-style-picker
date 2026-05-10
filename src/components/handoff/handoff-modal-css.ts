// Modal/lightbox styles for the handoff layout — selection summary,
// garment image lightbox, the detail hero affordance, and the responsive
// overrides that touch any of the above (plus the cross-cutting media
// queries for the list/gallery/detail). Kept in its own module to leave
// list/gallery/detail rules alone in handoff-view-css.ts.
import { PALETTE } from "./palette";

export const HANDOFF_MODAL_CSS = `
.mock-summary-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 16, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.mock-summary-card {
  width: 920px;
  max-width: 100%;
  max-height: 90vh;
  background: ${PALETTE.panel};
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.mock-summary-header {
  padding: 16px 20px;
  border-bottom: 1px solid ${PALETTE.rule};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
.mock-summary-title {
  font-size: 16px;
  font-weight: 700;
  color: ${PALETTE.ink};
  margin-bottom: 4px;
}
.mock-summary-close {
  width: 28px;
  height: 28px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.mock-summary-close:hover {
  background: ${PALETTE.bg};
}
.mock-summary-counts {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-shrink: 0;
}
.mock-summary-count-card {
  padding: 14px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 6px;
  background: ${PALETTE.bg};
}
.mock-summary-count-value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 600;
  font-family: var(--font-instrument-serif), Georgia, serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.mock-summary-table {
  flex: 1;
  overflow: auto;
  padding: 0 20px 20px;
}
.mock-summary-row {
  display: grid;
  grid-template-columns: 40px 56px 110px minmax(160px, 1fr) 80px 110px;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid ${PALETTE.ruleSoft};
  font-size: 12px;
}
.mock-summary-row-head {
  position: sticky;
  top: 0;
  background: ${PALETTE.panel};
  border-bottom: 1px solid ${PALETTE.rule};
}
.mock-image-lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 16, 0.92);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.mock-image-lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: rgba(26, 24, 21, 0.85);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
.mock-image-lightbox-close:hover {
  background: #fff;
  color: rgba(26, 24, 21, 1);
}
.mock-image-lightbox-caption {
  position: absolute;
  top: 20px;
  left: 20px;
  color: rgba(255, 255, 255, 0.85);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mock-image-lightbox-stage {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 0;
}
.mock-image-lightbox-image-wrap {
  position: relative;
  display: inline-flex;
  max-width: min(90vw, 1100px);
  max-height: min(78vh, 900px);
  transition: opacity 200ms ease-out;
}
.mock-image-lightbox-image {
  display: block;
  max-width: min(90vw, 1100px);
  max-height: min(78vh, 900px);
  width: auto;
  height: auto;
  object-fit: contain;
}
.mock-image-lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.mock-image-lightbox-arrow:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.mock-image-lightbox-arrow.prev {
  left: 24px;
}
.mock-image-lightbox-arrow.next {
  right: 24px;
}
.mock-image-lightbox-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}
.mock-image-lightbox-strip {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  overflow-x: auto;
  max-width: 100%;
}
.mock-image-lightbox-thumb {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
}
.mock-image-lightbox-thumb.active {
  border-color: ${PALETTE.peach};
  box-shadow: 0 0 0 2px ${PALETTE.peachBg};
}
.mock-detail-hero-button {
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  display: block;
  text-align: left;
  position: relative;
}
.mock-detail-hero-button:hover::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(20, 18, 16, 0.06);
  pointer-events: none;
}
@media (max-width: 700px) {
  .mock-summary-counts {
    grid-template-columns: repeat(2, 1fr);
  }
  .mock-summary-row,
  .mock-summary-row-head {
    grid-template-columns: 32px 44px 90px 1fr 64px 90px;
    font-size: 11px;
  }
}
@media (max-width: 1180px) {
  .mock-list-head,
  .mock-list-row {
    grid-template-columns: 36px 54px 120px minmax(160px, 1fr) 84px minmax(110px, 140px) 70px 86px;
  }
  .mock-list-head > :last-child,
  .mock-list-row > :last-child {
    display: none;
  }
  .mock-detail {
    width: 380px;
  }
}
@media (max-width: 940px) {
  .mock-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  .mock-shell {
    height: auto;
    min-height: 100vh;
  }
  .mock-list,
  .mock-gallery {
    overflow: visible;
  }
  .mock-topbar {
    height: auto;
    min-height: 46px;
    grid-template-columns: 1fr;
    padding: 10px 12px;
    gap: 8px;
  }
  .mock-top-left {
    flex-wrap: wrap;
  }
  .mock-mobile-menu-button {
    display: inline-flex;
  }
  .mock-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  /* Compact reviewer block: avatar + logout only, name hidden on mobile. */
  .mock-user-name {
    display: none;
  }
  /* Upload control collapses to icon-only on mobile. */
  .mock-upload {
    padding: 0 8px;
    gap: 0;
    font-size: 0;
    line-height: 0;
  }
  .mock-upload svg {
    width: 16px;
    height: 16px;
  }
  .mock-body {
    position: relative;
    display: block;
    overflow: visible;
  }
  .mock-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 220ms ease-out;
    border-right: 1px solid ${PALETTE.rule};
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
    pointer-events: none;
  }
  .mock-sidebar.mobile-open {
    transform: translateX(0);
    pointer-events: auto;
  }
  .mock-sidebar-close {
    display: inline-flex;
  }
  .mock-sidebar-backdrop {
    display: block;
  }
  .mock-content {
    min-height: 100%;
  }
  .mock-content-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .mock-review-note {
    text-align: left;
    display: none;
  }
  .mock-gallery {
    padding: 14px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .mock-status-bar-hints {
    display: none;
  }
  .mock-detail {
    position: fixed;
    inset: 0;
    width: 100%;
    max-height: none;
    z-index: 150;
    border-left: 0;
    border-top: 0;
    background: ${PALETTE.panel};
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .mock-detail-close {
    width: 32px;
    height: 32px;
    border: 1px solid ${PALETTE.rule};
    border-radius: 5px;
    background: ${PALETTE.panel};
    color: ${PALETTE.inkSoft};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: 8px;
  }
  .mock-detail-close:hover {
    background: ${PALETTE.peachBg};
    color: ${PALETTE.peach};
  }
}
@media (max-width: 560px) {
  .mock-segmented span,
  .mock-upload {
    font-size: 11px;
  }
  .mock-upload {
    padding: 0 8px;
  }
  .mock-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 10px;
    gap: 10px;
  }
  .mock-gallery-actions {
    align-items: flex-start;
    flex-direction: column;
  }
  .mock-detail-hero {
    height: 250px;
  }
}
`;
