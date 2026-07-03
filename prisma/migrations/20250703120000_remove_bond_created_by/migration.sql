-- Remove manual bond creation tracking; bonds are synced from external APCRDA APIs.
ALTER TABLE "tdr_bonds" DROP COLUMN IF EXISTS "created_by";
