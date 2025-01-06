/*
  Warnings:

  - You are about to drop the `post_category_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "post_category_assignments" DROP CONSTRAINT "post_category_assignments_category_id_fkey";

-- DropForeignKey
ALTER TABLE "post_category_assignments" DROP CONSTRAINT "post_category_assignments_post_id_fkey";

-- AlterTable
ALTER TABLE "post_categories" ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "post_category_assignments";

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
