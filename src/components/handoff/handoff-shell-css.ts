// Shell-level styles for the handoff layout — page container, top bar,
// sidebar, content header, status bar, and reviewer block. View-specific
// rules live in handoff-view-css.ts.
import { PALETTE } from "./palette";

export const HANDOFF_SHELL_CSS = `
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
.mock-mobile-menu-button {
  display: none;
  width: 30px;
  height: 30px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.mock-mobile-menu-button:hover {
  background: ${PALETTE.peachBg};
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
.mock-user-block {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mock-user-name {
  font-size: 12px;
  font-weight: 600;
  color: ${PALETTE.ink};
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mock-user-logout {
  width: 26px;
  height: 26px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 100ms ease-out, color 100ms ease-out;
}
.mock-user-logout:hover {
  background: ${PALETTE.peachBg};
  color: ${PALETTE.peach};
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
.mock-sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.mock-sidebar-close {
  display: none;
  width: 28px;
  height: 28px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.inkSoft};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.mock-sidebar-close:hover {
  background: ${PALETTE.peachBg};
  color: ${PALETTE.peach};
}
.mock-sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 16, 0.45);
  z-index: 85;
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
  padding: 0 12px;
  border: 1px solid ${PALETTE.rule};
  border-radius: 5px;
  background: ${PALETTE.panel};
  color: ${PALETTE.ink};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
.mock-status-bar {
  height: 32px;
  padding: 0 16px;
  border-top: 1px solid ${PALETTE.rule};
  background: ${PALETTE.bg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  font-size: 11px;
  color: ${PALETTE.inkLight};
}
.mock-status-bar-hints {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.mock-status-bar-hints span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
`;
