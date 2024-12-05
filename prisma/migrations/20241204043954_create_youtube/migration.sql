-- CreateTable
CREATE TABLE "youtube_playlist" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "youtube_playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_video_infos" (
    "id" TEXT NOT NULL,
    "time" VARCHAR(100) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "author" VARCHAR(100) NOT NULL,
    "views" VARCHAR(100) NOT NULL,
    "date" VARCHAR(100) NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "shareUrl" TEXT NOT NULL,
    "youtube_playlist_id" TEXT NOT NULL,

    CONSTRAINT "youtube_video_infos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "youtube_video_infos" ADD CONSTRAINT "youtube_video_infos_youtube_playlist_id_fkey" FOREIGN KEY ("youtube_playlist_id") REFERENCES "youtube_playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
