/*
  Warnings:

  - You are about to drop the column `clerk_user_id` on the `labels` table. All the data in the column will be lost.
  - You are about to drop the `board_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pin_categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `board_id` to the `labels` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "board_categories" DROP CONSTRAINT "board_categories_clerk_user_id_fkey";

-- DropForeignKey
ALTER TABLE "labels" DROP CONSTRAINT "labels_clerk_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pin_categories" DROP CONSTRAINT "pin_categories_clerk_user_id_fkey";

-- DropIndex
DROP INDEX "labels_clerk_user_id_idx";

-- AlterTable
ALTER TABLE "labels" DROP COLUMN "clerk_user_id",
ADD COLUMN     "board_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "board_categories";

-- DropTable
DROP TABLE "pin_categories";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "categories_clerk_user_id_idx" ON "categories"("clerk_user_id");

-- CreateIndex
CREATE INDEX "groups_board_id_idx" ON "groups"("board_id");

-- CreateIndex
CREATE INDEX "labels_board_id_idx" ON "labels"("board_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "users"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
