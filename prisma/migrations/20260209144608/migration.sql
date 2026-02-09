-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('single_choice', 'multi_select', 'yes_no', 'rating');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('draft', 'scheduled', 'active', 'closed');

-- CreateTable
CREATE TABLE "polls" (
    "id" UUID NOT NULL,
    "creator_id" VARCHAR NOT NULL,
    "channel_id" VARCHAR NOT NULL,
    "message_ts" VARCHAR,
    "question" TEXT NOT NULL,
    "poll_type" "PollType" NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" "PollStatus" NOT NULL DEFAULT 'active',
    "scheduled_at" TIMESTAMPTZ,
    "closes_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "added_by" VARCHAR,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "voter_id" VARCHAR NOT NULL,
    "voted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_templates" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes"("poll_id");

-- CreateIndex
CREATE INDEX "votes_voter_id_idx" ON "votes"("voter_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_poll_id_option_id_voter_id_key" ON "votes"("poll_id", "option_id", "voter_id");

-- CreateIndex
CREATE INDEX "poll_templates_user_id_idx" ON "poll_templates"("user_id");

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
