-- Âge et genre du client, saisis depuis le profil. Nullables : les comptes
-- déjà créés n'en ont pas, et la saisie reste facultative.

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" "Gender";
