// View-specific styles for the list view, gallery cards, and detail
// panel (matched fabric, decision stack, memo thread). Modals, the
// image lightbox, and responsive overrides live in handoff-modal-css.ts;
// shell-level rules live in handoff-shell-css.ts.
import { PALETTE } from "./palette";

export const HANDOFF_VIEW_CSS = `
.mock-list {
  flex: 1;
  overflow: auto;
}
.mock-list-head,
.mock-list-row {
  display: grid;
  grid-template-columns: 40px 58px 132px minmax(180px, 1fr) 94px minmax(130px, 170px) 76px 96px 112px;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
}
.mock-list-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${PALETTE.bg};
  border-bottom: 1px solid ${PALETTE.rule};
}
.mock-list-row {
  width: 100%;
  border: 0;
  border-bottom: 1px solid ${PALETTE.ruleSoft};
  background: transparent;
  color: ${PALETTE.ink};
  text-align: left;
  cursor: pointer;
}
.mock-list-row:hover {
  background: ${PALETTE.bg};
}
.mock-list-row.selected {
  background: ${PALETTE.peachBg};
  box-shadow: inset 3px 0 0 ${PALETTE.peach};
}
.mock-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #f5f3ee;
  overflow: hidden;
}
.mock-visual.thumb {
  width: 44px;
  height: 52px;
  aspect-ratio: auto;
  border: 1px solid ${PALETTE.rule};
  border-radius: 3px;
}
.mock-visual-img {
  object-fit: contain;
}
.mock-fallback-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.mock-row-code {
  display: grid;
  gap: 3px;
}
.mock-row-code > span {
  color: ${PALETTE.inkLight};
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mock-row-code em {
  width: fit-content;
  border-radius: 999px;
  background: ${PALETTE.peachBg};
  color: ${PALETTE.peach};
  padding: 2px 6px;
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.mock-truncate {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
}
.mock-status {
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.mock-status span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mock-status.empty {
  padding-left: 0;
  background: transparent;
  color: ${PALETTE.inkLight};
  font-weight: 500;
}
.mock-decision-buttons {
  display: flex;
  gap: 4px;
}
.mock-decision-buttons button {
  width: 24px;
  height: 24px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 4px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  font-size: 10px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}
.mock-decision-buttons.gallery {
  width: 100%;
  gap: 4px;
}
.mock-decision-buttons.gallery button {
  flex: 1;
  width: auto;
  height: auto;
  padding: 5px 0;
}
.mock-gallery {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  align-content: start;
  gap: 16px;
}
.mock-gallery-card {
  border: 1px solid ${PALETTE.rule};
  border-radius: 6px;
  overflow: hidden;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  text-align: left;
  cursor: pointer;
  position: relative;
  transition: border-color 100ms ease-out, box-shadow 100ms ease-out;
}
.mock-gallery-card.selected {
  border-color: ${PALETTE.peach};
  box-shadow: 0 0 0 3px ${PALETTE.peachBg};
}
.mock-gallery-hero {
  position: relative;
}
.mock-gallery-hero .mock-visual {
  aspect-ratio: 1 / 1;
}
.mock-gallery-hero .mock-visual-img {
  object-fit: cover;
}
.mock-gallery-status-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  border-radius: 999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.mock-gallery-memo-pill {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(26, 24, 21, 0.8);
  color: #fff;
  font-size: 10px;
}
.mock-gallery-body {
  padding: 14px 14px 12px;
  border-top: 1px solid ${PALETTE.ruleSoft};
}
.mock-gallery-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.mock-gallery-title .mock-mono:first-child {
  font-size: 12px;
}
.mock-gallery-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mock-gallery-body p {
  margin: 6px 0 0;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mock-decision-buttons.gallery button {
  padding: 7px 0;
  font-size: 11px;
}
.mock-detail {
  width: 420px;
  flex-shrink: 0;
  border-left: 1px solid ${PALETTE.rule};
  background: ${PALETTE.panel};
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.mock-detail-nav {
  height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid ${PALETTE.rule};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${PALETTE.bg};
}
.mock-detail-nav div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mock-detail-nav-end {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mock-detail-nav button {
  width: 26px;
  height: 26px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  cursor: pointer;
}
.mock-detail-hero {
  height: 300px;
  background: #f5f3ee;
  border-bottom: 1px solid ${PALETTE.ruleSoft};
}
.mock-detail-hero .mock-visual {
  height: 100%;
  aspect-ratio: auto;
}
.mock-detail-hero-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.mock-detail-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${PALETTE.bg};
}
.mock-thumb-tabs {
  padding: 8px 14px;
  border-bottom: 1px solid ${PALETTE.rule};
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: ${PALETTE.bg};
}
.mock-thumb-tabs button {
  padding: 0;
  border: 1px solid ${PALETTE.rule};
  border-radius: 4px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  transition: border-color 100ms ease-out, box-shadow 100ms ease-out;
}
.mock-thumb-tabs button.active {
  border-color: ${PALETTE.ink};
  color: ${PALETTE.ink};
  box-shadow: 0 0 0 2px ${PALETTE.peachBg};
}
.mock-thumb-tabs button[data-empty] {
  opacity: 0.55;
}
.mock-thumb-tabs-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  background: #f5f3ee;
  overflow: hidden;
}
.mock-thumb-tabs-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mock-thumb-tabs-placeholder {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  color: ${PALETTE.inkLight};
}
.mock-thumb-tabs-label {
  padding: 4px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  text-align: center;
  background: ${PALETTE.panel};
  color: inherit;
}
.mock-thumb-tabs button.active .mock-thumb-tabs-label {
  font-weight: 700;
}
.mock-detail-scroll {
  flex: 1;
  overflow: auto;
}
.mock-detail-section {
  padding: 15px 16px;
  border-bottom: 1px solid ${PALETTE.rule};
}
.mock-detail-section h2 {
  margin: 4px 0 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 19px;
  line-height: 1.2;
}
.mock-detail-section p {
  margin: 0;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
  line-height: 1.5;
}
.mock-meta-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 104px 1fr;
  gap: 7px 10px;
  font-size: 12px;
}
.mock-detail-price {
  margin-top: 10px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 6px;
  background: ${PALETTE.peachBg};
  padding: 8px 10px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.mock-detail-price span {
  color: ${PALETTE.peach};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.mock-detail-price b {
  color: ${PALETTE.ink};
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.mock-meta-grid span {
  color: ${PALETTE.inkLight};
}
.mock-meta-grid b {
  color: ${PALETTE.ink};
  font-weight: 600;
}
.mock-section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.mock-section-header span:last-child {
  color: ${PALETTE.inkLight};
  font-size: 11px;
}
.mock-fabric-list {
  display: grid;
  gap: 10px;
}
.mock-fabric-card {
  border: 1px solid ${PALETTE.rule};
  border-radius: 6px;
  padding: 10px;
  background: ${PALETTE.bg};
}
.mock-fabric-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}
.mock-fabric-card-head b {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.mock-fabric-card-head span {
  border-radius: 4px;
  background: ${PALETTE.peachBg};
  color: ${PALETTE.peach};
  padding: 2px 5px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
.mock-fabric-card small {
  display: block;
  margin-top: 5px;
  color: ${PALETTE.inkLight};
  font-size: 11px;
  line-height: 1.4;
}
.mock-price-line {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${PALETTE.rule};
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.mock-price-line span {
  color: ${PALETTE.inkLight};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.mock-price-line b {
  color: ${PALETTE.ink};
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.mock-empty-copy {
  color: ${PALETTE.inkLight} !important;
  font-style: italic;
}
.mock-decision-stack {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}
.mock-decision-stack button {
  min-height: 38px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  cursor: pointer;
}
.mock-decision-stack button span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
.mock-decision-stack i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.mock-detail-section textarea {
  width: 100%;
  margin-top: 8px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  padding: 10px;
  resize: vertical;
  outline: 0;
  font-size: 13px;
  line-height: 1.5;
}
.mock-memo-form-actions {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mock-memo-send {
  min-height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 5px;
  background: ${PALETTE.peach};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mock-memo-send:disabled {
  opacity: .5;
  cursor: default;
}
.mock-memo-thread {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.mock-memo-item {
  border: 1px solid ${PALETTE.ruleSoft};
  border-radius: 5px;
  padding: 8px 10px;
  background: ${PALETTE.bg};
}
.mock-memo-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}
.mock-memo-meta b {
  font-size: 12px;
  color: ${PALETTE.ink};
}
.mock-memo-item p {
  margin: 0;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.mock-memo-loadmore {
  width: 100%;
  border: 1px dashed ${PALETTE.rule};
  border-radius: 5px;
  background: transparent;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
}
.mock-memo-loadmore:disabled {
  opacity: .5;
  cursor: default;
}
.mock-spin {
  animation: mock-spin 0.9s linear infinite;
}
@keyframes mock-spin {
  to { transform: rotate(360deg); }
}
`;
