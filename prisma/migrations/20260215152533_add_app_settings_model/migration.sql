-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "shortcutsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "openaiBaseUrl" TEXT,
    "anthropicBaseUrl" TEXT,
    "openaiApiKey" TEXT,
    "anthropicApiKey" TEXT,
    "openaiModel" TEXT,
    "anthropicModel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");
