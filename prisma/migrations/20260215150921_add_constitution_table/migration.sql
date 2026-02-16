-- CreateTable
CREATE TABLE "constitutions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "principles" JSONB,
    "version" TEXT,
    "ratified_date" TIMESTAMP(3),
    "last_amended_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constitutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "constitutions_project_id_key" ON "constitutions"("project_id");

-- AddForeignKey
ALTER TABLE "constitutions" ADD CONSTRAINT "constitutions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
