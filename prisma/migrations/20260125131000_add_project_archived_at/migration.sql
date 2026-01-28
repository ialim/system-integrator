-- Add project archive timestamp
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);
