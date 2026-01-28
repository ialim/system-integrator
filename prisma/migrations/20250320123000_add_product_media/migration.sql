-- Add product media fields
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "datasheet_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "media" JSONB;
