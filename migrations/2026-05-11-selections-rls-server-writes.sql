-- Issue #18: drop anon write policies on selections + memos.
-- After this migration, anon clients can only SELECT. All writes must go through
-- /api/selections and /api/memos route handlers, which use SUPABASE_SERVICE_ROLE_KEY
-- (which bypasses RLS).

drop policy if exists "selections_insert" on selections;
drop policy if exists "selections_update" on selections;
drop policy if exists "selections_delete" on selections;
drop policy if exists "memos_insert" on memos;

-- Sanity check after running:
--   select policyname, cmd from pg_policies where tablename in ('selections','memos');
-- Expected rows:
--   selections | selections_read | SELECT
--   memos      | memos_read      | SELECT
