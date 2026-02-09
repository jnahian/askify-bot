-- CreateIndex
CREATE INDEX "polls_status_idx" ON "polls"("status");

-- CreateIndex
CREATE INDEX "polls_creator_id_idx" ON "polls"("creator_id");

-- CreateIndex
CREATE INDEX "polls_status_closes_at_idx" ON "polls"("status", "closes_at");

-- CreateIndex
CREATE INDEX "polls_status_scheduled_at_idx" ON "polls"("status", "scheduled_at");
