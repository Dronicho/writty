/*
  Warnings:

  - Added the required column `transactionId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "url" TEXT NOT NULL,
    "internalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "transactionId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    CONSTRAINT "Post_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("coverImage", "internalUrl", "title", "url", "userAddress") SELECT "coverImage", "internalUrl", "title", "url", "userAddress" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_url_key" ON "Post"("url");
CREATE UNIQUE INDEX "Post_internalUrl_key" ON "Post"("internalUrl");
CREATE UNIQUE INDEX "Post_transactionId_key" ON "Post"("transactionId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
