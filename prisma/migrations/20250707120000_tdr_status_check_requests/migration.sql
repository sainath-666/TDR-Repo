-- TDR Status Check requests submitted from the public portal.
CREATE TYPE "TdrStatusCheckRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TABLE "tdr_status_check_requests" (
  "id" UUID NOT NULL,
  "reference_id" TEXT NOT NULL,
  "tdr_number" TEXT NOT NULL,
  "remarks" TEXT,
  "status" "TdrStatusCheckRequestStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tdr_status_check_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tdr_status_check_documents" (
  "id" UUID NOT NULL,
  "request_id" UUID NOT NULL,
  "file_name" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "size_kb" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tdr_status_check_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tdr_status_check_requests_reference_id_key" ON "tdr_status_check_requests"("reference_id");
CREATE INDEX "tdr_status_check_requests_tdr_number_idx" ON "tdr_status_check_requests"("tdr_number");
CREATE INDEX "tdr_status_check_requests_created_at_idx" ON "tdr_status_check_requests"("created_at");
CREATE INDEX "tdr_status_check_documents_request_id_idx" ON "tdr_status_check_documents"("request_id");

ALTER TABLE "tdr_status_check_documents"
  ADD CONSTRAINT "tdr_status_check_documents_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "tdr_status_check_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
