/*
  Warnings:

  - You are about to drop the column `clarifications` on the `features` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "features" DROP COLUMN "clarifications",
ADD COLUMN     "analysisContent" TEXT,
ADD COLUMN     "checklistsContent" TEXT,
ADD COLUMN     "clarificationsContent" TEXT,
ADD COLUMN     "constitution_version_id" TEXT,
ADD COLUMN     "contractsContent" TEXT,
ADD COLUMN     "dataModelContent" TEXT,
ADD COLUMN     "quickstartContent" TEXT,
ADD COLUMN     "researchContent" TEXT,
ADD COLUMN     "tasksContent" TEXT;

-- CreateTable
CREATE TABLE "constitution_versions" (
    "id" TEXT NOT NULL,
    "constitution_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "principles" JSONB NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'update',
    "changeNote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "constitution_versions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_constitution_version_id_fkey" FOREIGN KEY ("constitution_version_id") REFERENCES "constitution_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constitution_versions" ADD CONSTRAINT "constitution_versions_constitution_id_fkey" FOREIGN KEY ("constitution_id") REFERENCES "constitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
