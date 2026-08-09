-- Un âge saisi une fois se périme en silence : on stocke la date de naissance
-- et l'âge est recalculé à chaque envoi. La colonne « age » n'a jamais reçu de
-- donnée, sa suppression est sans perte.

-- AlterTable
ALTER TABLE "User" DROP COLUMN "age",
ADD COLUMN     "birthDate" DATE;
