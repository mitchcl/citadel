-- AlterTable
ALTER TABLE "league_matches" ADD COLUMN     "away_score" INTEGER,
ADD COLUMN     "home_score" INTEGER,
ADD COLUMN     "scheduled_at" TIMESTAMP(3);
