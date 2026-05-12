-- Per-style manual override of the top-level spec columns (contents,
-- construction, weight, fabric_no, division, designed_by). UI: "Edit style"
-- modal in DetailPanel and /admin. API: PATCH /api/styles/[id]/spec
-- (service-role). When set, the columns on `styles` are still the raw PDF
-- parse — applySpecOverride() merges the override on top at fetch time so the
-- rest of the app keeps using `style.contents` etc. unchanged. Null clears it.
alter table styles add column if not exists spec_override jsonb;

comment on column styles.spec_override is
  'Per-style manual override of the parsed PDF spec. When non-null, applySpecOverride layers these values over the raw columns at fetch time so the displayed top spec uses the corrected values while the original parse stays preserved on the base columns. Shape: { contents?, construction?, weight?, fabric_no?, division?, designed_by? }.';
