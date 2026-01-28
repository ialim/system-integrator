-- Auth provider + MFA fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE');
  END IF;
END
$$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" "AuthProvider" NOT NULL DEFAULT 'PASSWORD';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_enabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_secret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

-- MFA challenges for step-up login
CREATE TABLE IF NOT EXISTS "mfa_challenges" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  CONSTRAINT "mfa_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "mfa_challenges_user_id_idx" ON "mfa_challenges"("user_id");
