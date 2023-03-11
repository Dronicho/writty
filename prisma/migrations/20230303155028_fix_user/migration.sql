-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT
);
INSERT INTO "new_User" ("address", "bio", "name") SELECT "address", "bio", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
