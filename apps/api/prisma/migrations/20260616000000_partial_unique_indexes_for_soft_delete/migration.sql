-- Drop standard unique indexes on tables with soft delete
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "Product_sku_key";

-- Create partial unique indexes that only enforce uniqueness on active (non-soft-deleted) records
CREATE UNIQUE INDEX "User_email_key" ON "User"("email") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku") WHERE "deletedAt" IS NULL;
