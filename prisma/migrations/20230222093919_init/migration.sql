-- CreateTable
CREATE TABLE "Listing" (
    "resourceId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemKind" INTEGER NOT NULL,
    "itemRarity" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_resourceId_key" ON "Listing"("resourceId");
