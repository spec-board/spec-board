-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'vi';

-- CreateTable
CREATE TABLE "mind_map_nodes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'New Idea',
    "color" TEXT NOT NULL DEFAULT '#f6ad55',
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'default',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mind_map_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mind_map_edges" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mind_map_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mind_map_edges_source_id_target_id_key" ON "mind_map_edges"("source_id", "target_id");

-- AddForeignKey
ALTER TABLE "mind_map_nodes" ADD CONSTRAINT "mind_map_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_map_nodes" ADD CONSTRAINT "mind_map_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "mind_map_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_map_edges" ADD CONSTRAINT "mind_map_edges_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_map_edges" ADD CONSTRAINT "mind_map_edges_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "mind_map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_map_edges" ADD CONSTRAINT "mind_map_edges_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "mind_map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
