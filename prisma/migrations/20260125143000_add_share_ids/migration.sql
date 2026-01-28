-- Add share ids for client links
ALTER TABLE "bom_versions" ADD COLUMN IF NOT EXISTS "share_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "share_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "bom_versions_share_id_key" ON "bom_versions"("share_id");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_share_id_key" ON "orders"("share_id");
