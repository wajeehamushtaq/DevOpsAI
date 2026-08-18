/*
  Warnings:

  - Added the required column `createdById` to the `Incident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Incident_createdById_idx" ON "Incident"("createdById");

-- CreateIndex
CREATE INDEX "Incident_assignedToId_idx" ON "Incident"("assignedToId");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
