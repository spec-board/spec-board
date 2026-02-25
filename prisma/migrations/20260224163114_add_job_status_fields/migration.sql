-- AlterTable
ALTER TABLE "features" ADD COLUMN     "inngest_run_id" TEXT,
ADD COLUMN     "job_completed_at" TIMESTAMP(3),
ADD COLUMN     "job_message" TEXT,
ADD COLUMN     "job_progress" INTEGER DEFAULT 0,
ADD COLUMN     "job_started_at" TIMESTAMP(3),
ADD COLUMN     "job_status" TEXT DEFAULT 'idle';
