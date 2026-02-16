/*
  Warnings:

  - You are about to drop the column `anthropicApiKey` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `anthropicBaseUrl` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `anthropicModel` on the `app_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_settings" DROP COLUMN "anthropicApiKey",
DROP COLUMN "anthropicBaseUrl",
DROP COLUMN "anthropicModel",
ALTER COLUMN "aiProvider" SET DEFAULT 'openai';

-- AlterTable
ALTER TABLE "features" ADD COLUMN     "clarifications" TEXT;
