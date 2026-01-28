DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProvider') THEN
    CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL,
  "reference" TEXT NOT NULL UNIQUE,
  "authorization_url" TEXT,
  "access_code" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments"("order_id");
