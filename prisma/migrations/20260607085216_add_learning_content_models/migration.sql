-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'PDF', 'NOTE', 'IMAGE', 'AUDIO', 'EXTERNAL_LINK');

-- CreateTable
CREATE TABLE "course_sections" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_contents" (
    "id" BIGSERIAL NOT NULL,
    "section_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_type" "ContentType" NOT NULL,
    "position" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" BIGSERIAL NOT NULL,
    "content_id" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "public_id" TEXT,
    "secure_url" TEXT NOT NULL,
    "original_file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_sections_course_id_idx" ON "course_sections"("course_id");

-- CreateIndex
CREATE INDEX "course_contents_section_id_idx" ON "course_contents"("section_id");

-- CreateIndex
CREATE INDEX "content_assets_content_id_idx" ON "content_assets"("content_id");

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "course_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
