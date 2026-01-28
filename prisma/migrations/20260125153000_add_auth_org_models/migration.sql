-- Add email verification tracking
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);

-- Invites for org members
CREATE TABLE IF NOT EXISTS "invites" (
  "id" SERIAL PRIMARY KEY,
  "org_id" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ESTIMATOR',
  "token" TEXT NOT NULL UNIQUE,
  "created_by" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "accepted_by" INTEGER,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "invites_org_email_idx" ON "invites"("org_id", "email");

-- Refresh tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- Password reset tokens
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- Email verification tokens
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");
