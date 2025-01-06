/*
  Warnings:

  - You are about to drop the column `author` on the `posts` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `post_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_fkey";

-- DropIndex
DROP INDEX "post_categories_name_key";

-- AlterTable
ALTER TABLE "post_categories" ADD COLUMN "user_id" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "user_id" TEXT;

-- Data Migration
UPDATE "posts" SET "user_id" = "author";

-- DropColumn
ALTER TABLE "posts" DROP COLUMN "author";

-- AlterTable
ALTER TABLE "post_categories" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;