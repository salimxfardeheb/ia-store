/**
 * Normalise un numéro de téléphone algérien au format E.164 : +213XXXXXXXXX.
 *
 * Accepte :
 *   - "0612345678"        → "+213612345678"
 *   - "+213612345678"     → "+213612345678"
 *   - "213612345678"      → "+213612345678"
 *   - "06 12 34 56 78"    → "+213612345678"  (espaces, tirets, points, parenthèses ignorés)
 *
 * Retourne `null` si l'entrée ne ressemble pas à un numéro DZ valide.
 * Utile à la fois pour stocker un format unique en DB (analytics, dédup)
 * et comme clé de rate-limit (anti-flood commandes).
 */
export function normalizePhoneDZ(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, "");

  // +213XXXXXXXXX (9 chiffres après l'indicatif)
  const withPlus = cleaned.match(/^\+213(\d{9})$/);
  if (withPlus) return "+213" + withPlus[1];

  // 213XXXXXXXXX sans le +
  const withoutPlus = cleaned.match(/^213(\d{9})$/);
  if (withoutPlus) return "+213" + withoutPlus[1];

  // Format local 0XXXXXXXXX (10 chiffres, 0 initial)
  const local = cleaned.match(/^0(\d{9})$/);
  if (local) return "+213" + local[1];

  return null;
}
