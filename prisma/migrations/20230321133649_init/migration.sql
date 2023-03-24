-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Post" (
    "url" TEXT NOT NULL,
    "internalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "transactionId" TEXT,
    "tokenId" TEXT NOT NULL DEFAULT '',
    "userAddress" TEXT NOT NULL,
    "maxAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'FOO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signingKey" BYTEA,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "_collectors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Post_url_key" ON "Post"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Post_internalUrl_key" ON "Post"("internalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Post_transactionId_key" ON "Post"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "_collectors_AB_unique" ON "_collectors"("A", "B");

-- CreateIndex
CREATE INDEX "_collectors_B_index" ON "_collectors"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectors" ADD CONSTRAINT "_collectors_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_collectors" ADD CONSTRAINT "_collectors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;
