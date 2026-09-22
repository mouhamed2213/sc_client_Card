-- AlterTable
ALTER TABLE "users" ADD COLUMN     "formule" "Formule";

-- CreateTable
CREATE TABLE "client_credentials" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_credentials_userId_key" ON "client_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_credentials_username_key" ON "client_credentials"("username");

-- AddForeignKey
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
