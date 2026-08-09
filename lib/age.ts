/**
 * Âge du client — calculé, jamais stocké.
 *
 * La boutique conserve une date de naissance : un âge saisi une fois se périme
 * en silence, et les services tiers qui s'en servent pour scorer une
 * réclamation travailleraient alors sur une valeur fausse sans le savoir.
 *
 * Module sans dépendance : utilisable par la validation comme par la
 * construction des payloads.
 */

/** Bornes admises, à la saisie comme à l'envoi. */
export const MIN_AGE = 16;
export const MAX_AGE = 120;

/**
 * Âge en années révolues à la date `at`, ou `null` si la date de naissance est
 * inexploitable : absente, invalide, dans le futur, ou hors bornes.
 *
 * Le calcul est fait en UTC, cohérent avec le stockage (`@db.Date`), pour
 * qu'un fuseau ne décale pas l'anniversaire d'un jour.
 */
export function ageFromBirthDate(
  birthDate: Date | null | undefined,
  at: Date = new Date()
): number | null {
  if (!birthDate || Number.isNaN(birthDate.getTime())) return null;

  let age = at.getUTCFullYear() - birthDate.getUTCFullYear();

  // L'anniversaire n'est pas encore passé cette année-là.
  const monthDiff = at.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  if (age < MIN_AGE || age > MAX_AGE) return null;
  return age;
}
