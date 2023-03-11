-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "userAddress" TEXT NOT NULL,
    CONSTRAINT "Post_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("coverImage", "title", "url", "userAddress") SELECT "coverImage", "title", "url", "userAddress" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_url_key" ON "Post"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
