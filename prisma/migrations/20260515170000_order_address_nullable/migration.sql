-- Order.city / address / postalCode : passage en nullable
-- Les ventes OFFLINE (POS) n'ont pas d'adresse ; on inscrivait "" jusque-la,
-- ce qui polluait l'analytique (CA par wilaya, requetes "OFFLINE sans adresse").
-- On nettoie egalement les "" existants en NULL pour rendre la donnee coherente.

ALTER TABLE "Order" ALTER COLUMN "city"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "address"    DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "postalCode" DROP NOT NULL;

UPDATE "Order" SET "city"       = NULL WHERE "city"       = '';
UPDATE "Order" SET "address"    = NULL WHERE "address"    = '';
UPDATE "Order" SET "postalCode" = NULL WHERE "postalCode" = '';
