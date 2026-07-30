-- Database-level hardening applied after `prisma db push` (which can't express
-- triggers). Run with: pnpm --filter @tally/db harden
--
-- Makes the admin audit trail truly immutable: a trigger blocks UPDATE and
-- DELETE on AdminAuditLog for EVERYONE, including the table owner — so "append
-- only" is enforced by the database, not just by application code.
--
-- Production note: additionally run the app under a DB role with only
-- INSERT/SELECT on this table, and export it nightly to object storage.

CREATE OR REPLACE FUNCTION tally_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only: % on % is not permitted', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_mutation ON "AdminAuditLog";
CREATE TRIGGER block_mutation
  BEFORE UPDATE OR DELETE ON "AdminAuditLog"
  FOR EACH ROW EXECUTE FUNCTION tally_block_mutation();
