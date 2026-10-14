-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "priority" "IncidentPriority" NOT NULL DEFAULT 'P3';
