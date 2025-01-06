/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `post_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "post_categories_name_key" ON "post_categories"("name");
