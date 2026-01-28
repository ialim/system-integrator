ALTER TABLE "orgs" ADD COLUMN IF NOT EXISTS "business_address" JSONB;
ALTER TABLE "orgs" ADD COLUMN IF NOT EXISTS "proposal_defaults" JSONB;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "proposal_meta" JSONB;
