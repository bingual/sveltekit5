-- CreateTable
CREATE TABLE "memos" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "memo_id" TEXT NOT NULL,

    CONSTRAINT "memo_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "memos" ADD CONSTRAINT "memos_author_fkey" FOREIGN KEY ("author") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_images" ADD CONSTRAINT "memo_images_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "memos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
