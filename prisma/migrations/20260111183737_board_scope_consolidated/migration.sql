/*
  Warnings:

  - You are about to drop the column `clerk_user_id` on the `labels` table. All the data in the column will be lost.
  - Added the required column `board_id` to the `labels` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "labels" DROP CONSTRAINT "labels_clerk_user_id_fkey";

-- DropIndex
DROP INDEX "labels_clerk_user_id_idx";

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "labels" DROP COLUMN "clerk_user_id",
ADD COLUMN     "board_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#8B5CF6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "groups_board_id_idx" ON "groups"("board_id");

-- CreateIndex
CREATE INDEX "labels_board_id_idx" ON "labels"("board_id");

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
