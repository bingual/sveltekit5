-- CreateTable
CREATE TABLE "memo_categories" (
    "id" TEXT NOT NULL,
    "memoId" TEXT,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memo_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_sub_categories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memo_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memo_categories_name_key" ON "memo_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "memo_sub_categories_name_category_id_key" ON "memo_sub_categories"("name", "category_id");

-- AddForeignKey
ALTER TABLE "memo_categories" ADD CONSTRAINT "memo_categories_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "memos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_sub_categories" ADD CONSTRAINT "memo_sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "memo_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
