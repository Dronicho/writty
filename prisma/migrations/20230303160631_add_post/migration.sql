-- CreateTable
CREATE TABLE "Post" (
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    CONSTRAINT "Post_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_url_key" ON "Post"("url");
