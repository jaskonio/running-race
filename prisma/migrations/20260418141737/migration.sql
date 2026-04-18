-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stravaAthleteId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "stravaActivityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "movingTimeSec" INTEGER NOT NULL,
    "elapsedTimeSec" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDistance" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyDistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "activitiesFetched" INTEGER NOT NULL DEFAULT 0,
    "activitiesStored" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_stravaAthleteId_key" ON "Participant"("stravaAthleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_stravaActivityId_key" ON "Activity"("stravaActivityId");

-- CreateIndex
CREATE INDEX "Activity_participantId_idx" ON "Activity"("participantId");

-- CreateIndex
CREATE INDEX "Activity_activityDate_idx" ON "Activity"("activityDate");

-- CreateIndex
CREATE INDEX "Activity_participantId_activityDate_idx" ON "Activity"("participantId", "activityDate");

-- CreateIndex
CREATE INDEX "DailyDistance_date_idx" ON "DailyDistance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDistance_participantId_date_key" ON "DailyDistance"("participantId", "date");

-- CreateIndex
CREATE INDEX "SyncRun_participantId_idx" ON "SyncRun"("participantId");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDistance" ADD CONSTRAINT "DailyDistance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
