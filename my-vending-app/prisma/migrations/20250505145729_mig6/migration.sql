/*
  Warnings:

  - You are about to drop the column `rfidTag` on the `Order` table. All the data in the column will be lost.
  - Added the required column `rfidNo` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "rfidTag",
ADD COLUMN     "rfidNo" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
