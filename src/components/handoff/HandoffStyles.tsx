"use client";

import { PALETTE } from "./palette";

const HANDOFF_CSS = `
.mock-page {
  height: 100vh;
  overflow: hidden;
  background: ${PALETTE.bg};
  color: ${PALETTE.ink};
  font-family: var(--font-body), Inter, system-ui, sans-serif;
}
.mock-page button, .mock-page input, .mock-page textarea {
  font-family: inherit;
}
.mock-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.mock-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: ${PALETTE.ink};
  font-variant-numeric: tabular-nums;
}
.mock-muted {
  color: ${PALETTE.inkLight};
}
.mock-kbd {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${PALETTE.rule};
  border-radius: 3px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 600;
}
.mock-topbar {
  height: 46px;
  padding: 0 16px;
  border-bottom: 1px solid ${PALETTE.rule};
  display: grid;
  grid-template-columns: minmax(210px, auto) minmax(240px, 420px) auto;
  align-items: center;
  gap: 12px;
  background: ${PALETTE.bg};
  flex-shrink: 0;
}
.mock-top-left, .mock-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mock-dot-separator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${PALETTE.inkLight};
}
.mock-source-pill {
  border: 1px solid ${PALETTE.rule};
  border-radius: 999px;
  padding: 3px 8px;
  color: ${PALETTE.inkSoft};
  background: ${PALETTE.panel};
  font-size: 11px;
  white-space: nowrap;
}
.mock-search {
  height: 30px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 10px;
  min-width: 0;
}
.mock-search svg {
  color: ${PALETTE.inkLight};
  flex-shrink: 0;
}
.mock-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${PALETTE.ink};
  font-size: 12px;
}
.mock-actions {
  justify-content: flex-end;
}
.mock-segmented {
  height: 30px;
  display: flex;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  overflow: hidden;
  background: ${PALETTE.panel};
}
.mock-segmented button, .mock-upload {
  height: 30px;
  border: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: ${PALETTE.inkSoft};
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}
.mock-segmented button + button {
  border-left: 1px solid ${PALETTE.rule};
}
.mock-segmented button.active {
  color: #fff;
  background: ${PALETTE.ink};
}
.mock-upload {
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
}
.mock-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${PALETTE.sage};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.mock-body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.mock-sidebar {
  width: 236px;
  flex-shrink: 0;
  border-right: 1px solid ${PALETTE.rule};
  background: ${PALETTE.bg};
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.mock-sidebar-block {
  padding: 14px;
  border-bottom: 1px solid ${PALETTE.rule};
}
.mock-sidebar-grow {
  flex: 1;
  overflow: auto;
}
.mock-brand-mark {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
}
.mock-brand-mark span {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${PALETTE.peach};
  color: #fff;
  font-family: Georgia, serif;
  font-style: italic;
}
.mock-progress-title, .mock-progress-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mock-progress-title {
  padding: 8px 10px;
  border-radius: 6px;
  background: ${PALETTE.peachBg};
  font-size: 13px;
  font-weight: 600;
}
.mock-progress-track {
  height: 4px;
  margin-top: 9px;
  border-radius: 3px;
  background: ${PALETTE.ruleSoft};
  overflow: hidden;
}
.mock-progress-track div {
  height: 100%;
  background: ${PALETTE.peach};
}
.mock-menu {
  margin-top: 9px;
  display: grid;
  gap: 2px;
}
.mock-menu button {
  min-height: 31px;
  border: 0;
  border-radius: 5px;
  padding: 0 10px;
  background: transparent;
  color: ${PALETTE.inkSoft};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.mock-menu button:hover,
.mock-menu button.active {
  background: ${PALETTE.peachBg};
  color: ${PALETTE.ink};
}
.mock-sidebar-footer {
  padding: 12px;
  border-top: 1px solid ${PALETTE.rule};
  display: grid;
  gap: 9px;
}
.mock-sidebar-summary {
  min-height: 34px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.mock-sidebar-summary:hover {
  background: ${PALETTE.peachBg};
}
.mock-sidebar-footer div {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mock-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.panel};
}
.mock-content-header {
  min-height: 52px;
  padding: 11px 16px;
  border-bottom: 1px solid ${PALETTE.rule};
  background: ${PALETTE.bg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.mock-content-header h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.1;
  font-weight: 700;
}
.mock-content-header p {
  margin: 3px 0 0;
  color: ${PALETTE.inkLight};
  font-size: 12px;
}
.mock-review-note {
  max-width: 470px;
  color: ${PALETTE.inkSoft};
  font-size: 12px;
  line-height: 1.45;
  text-align: right;
}
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
  width: 28px;
  height: 26px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 4px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}
.mock-gallery {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  align-content: start;
  gap: 12px;
}
.mock-gallery-card {
  border: 1px solid ${PALETTE.rule};
  border-radius: 6px;
  overflow: hidden;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  text-align: left;
  cursor: pointer;
}
.mock-gallery-card.selected {
  border-color: ${PALETTE.peach};
  box-shadow: 0 0 0 3px ${PALETTE.peachBg};
}
.mock-gallery-body {
  padding: 10px 11px;
  border-top: 1px solid ${PALETTE.ruleSoft};
}
.mock-gallery-title, .mock-gallery-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mock-gallery-body p {
  min-height: 34px;
  margin: 5px 0 10px;
  color: ${PALETTE.inkSoft};
  font-size: 11px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  gap: 6px;
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
.mock-fabric-texture {
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 70px rgba(26,24,21,.2);
}
.mock-detail-closeup {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.mock-detail-closeup .mock-fabric-texture {
  position: absolute;
  inset: 0;
  transform: scale(1.05);
}
.mock-detail-closeup div:nth-child(2) {
  position: absolute;
  left: 0;
  right: 0;
  top: 88px;
  height: 24px;
  border-top: 1px solid rgba(26,24,21,.35);
  border-bottom: 1px solid rgba(26,24,21,.25);
  background: rgba(255,255,255,.2);
}
.mock-detail-closeup span {
  position: absolute;
  left: 14px;
  bottom: 12px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(26,24,21,.72);
  color: #fff;
  font-size: 11px;
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
  height: 30px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 4px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.mock-thumb-tabs button.active {
  border-color: ${PALETTE.ink};
  color: ${PALETTE.ink};
  box-shadow: 0 0 0 2px ${PALETTE.peachBg};
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
  .mock-topbar {
    height: auto;
    min-height: 46px;
    grid-template-columns: 1fr;
    padding: 10px 12px;
  }
  .mock-actions {
    justify-content: flex-start;
    overflow-x: auto;
  }
  .mock-sidebar {
    display: none;
  }
  .mock-body {
    display: block;
    overflow: auto;
  }
  .mock-content {
    min-height: 620px;
  }
  .mock-content-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .mock-review-note {
    text-align: left;
  }
  .mock-list {
    overflow-x: auto;
  }
  .mock-list-head,
  .mock-list-row {
    min-width: 980px;
  }
  .mock-detail {
    width: 100%;
    max-height: none;
    border-left: 0;
    border-top: 1px solid ${PALETTE.rule};
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

export default function HandoffStyles() {
  return <style>{HANDOFF_CSS}</style>;
}
