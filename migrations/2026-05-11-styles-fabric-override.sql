-- Per-style admin override of the workbook fabric mapping. UI: /admin "Edit
-- fabric" modal. API: PATCH /api/styles/[id]/fabric (service-role). Override
-- takes precedence over the fabric-mappings/current.json rows in
-- attachFabricDetailsFromRows; when set to null, the workbook mapping applies
-- again.
alter table styles add column if not exists fabric_override jsonb;

comment on column styles.fabric_override is
  'Per-style manual override of fabric_details. When non-null, takes precedence over the workbook mapping in attachFabricDetails. Shape: { fabricCode, supplier, construction, content, widthInch, weightGm2, priceYd, priceLb, finish, yarnDetail, comment, fabricCountry, originalText, ... } (any subset of FabricDetail keys).';
