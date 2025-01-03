/*
  Warnings:

  - You are about to drop the `memo_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `memo_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `memo_sub_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `memos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "memo_categories" DROP CONSTRAINT "memo_categories_memoId_fkey";

-- DropForeignKey
ALTER TABLE "memo_images" DROP CONSTRAINT "memo_images_memo_id_fkey";

-- DropForeignKey
ALTER TABLE "memo_sub_categories" DROP CONSTRAINT "memo_sub_categories_category_id_fkey";

-- DropForeignKey
ALTER TABLE "memos" DROP CONSTRAINT "memos_author_fkey";

-- DropTable
DROP TABLE "memo_categories";

-- DropTable
DROP TABLE "memo_images";

-- DropTable
DROP TABLE "memo_sub_categories";

-- DropTable
DROP TABLE "memos";

-- CreateTable
CREATE TABLE "post_category_assignments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "post_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_sub_categories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "post_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_images" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_category_assignments_post_id_category_id_key" ON "post_category_assignments"("post_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_categories_name_key" ON "post_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "post_sub_categories_name_category_id_key" ON "post_sub_categories"("name", "category_id");

-- AddForeignKey
ALTER TABLE "post_category_assignments" ADD CONSTRAINT "post_category_assignments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_category_assignments" ADD CONSTRAINT "post_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_sub_categories" ADD CONSTRAINT "post_sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
