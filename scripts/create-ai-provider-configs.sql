-- Create ai_provider_configs table if not exists
CREATE TABLE IF NOT EXISTS "ai_provider_configs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "provider" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "apiKey" TEXT,
  "oauthToken" TEXT,
  "oauthRefresh" TEXT,
  "oauthExpiresAt" TIMESTAMP(3),
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);
