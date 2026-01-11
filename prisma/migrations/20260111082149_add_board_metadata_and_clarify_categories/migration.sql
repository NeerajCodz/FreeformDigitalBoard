/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_clerk_user_id_fkey";

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "board_category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "categories";

-- CreateTable
CREATE TABLE "board_categories" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_categories" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pin_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_categories_clerk_user_id_idx" ON "board_categories"("clerk_user_id");

-- CreateIndex
CREATE INDEX "pin_categories_clerk_user_id_idx" ON "pin_categories"("clerk_user_id");

-- AddForeignKey
ALTER TABLE "board_categories" ADD CONSTRAINT "board_categories_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "users"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_categories" ADD CONSTRAINT "pin_categories_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "users"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
