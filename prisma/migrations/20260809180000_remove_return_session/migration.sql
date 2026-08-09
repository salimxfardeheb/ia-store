-- Le suivi des sessions de retour est délégué à Flowmerce : la boutique ne
-- conserve plus ni token ni URL. Son API reste seule dépositaire de la
-- réclamation et permet de la relire.

-- DropForeignKey
ALTER TABLE "ReturnSession" DROP CONSTRAINT "ReturnSession_orderId_fkey";

-- DropTable
DROP TABLE "ReturnSession";
