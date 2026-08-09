/**
 * Flowmerce — création de session de retour (tunnel « page hébergée »).
 *
 * Le formulaire de la page de retour est généré à partir de ce payload : chaque
 * champ transmis y est affiché en récapitulatif (lecture seule), chaque champ
 * absent devient une saisie de plus pour le client. On envoie donc tout ce que
 * la commande contient déjà — mais jamais une valeur invalide, qui ferait
 * échouer la création de session (400) au lieu de simplement dégrader la page.
 *
 * Règle : aucune valeur n'est tronquée, vidée ni remplacée par un placeholder.
 * Un champ qui ne respecte pas les contraintes est OMIS et signalé dans
 * `omitted` pour être loggué par l'appelant.
 *
 * Ce module est volontairement sans dépendance framework (pas de Prisma, pas
 * de Next) : toute la logique de payload est isolée de la route.
 */

import { MAX_AGE, MIN_AGE } from "@/lib/age";

// ─── Valeurs acceptées par Flowmerce ─────────────────────────────────────────

export const FLOWMERCE_PAYMENT_METHODS = [
  "Cash on Delivery",
  "Card",
  "CCP",
  "Bank Transfer",
] as const;

export type FlowmercePaymentMethod = (typeof FLOWMERCE_PAYMENT_METHODS)[number];

/**
 * Valeurs de genre transmises à Flowmerce.
 *
 * ⚠ Non documentées dans le contrat du endpoint, contrairement aux moyens de
 * paiement. Si Flowmerce en attend d'autres (« M »/« F », « homme »/« femme »),
 * le champ sera ignoré en silence — exactement le piège qui avait vidé
 * `shipping_method`. À confirmer avant de s'y fier.
 */
export const FLOWMERCE_GENDERS = ["Male", "Female"] as const;

export type FlowmerceGender = (typeof FLOWMERCE_GENDERS)[number];

/** Notre énumération Prisma (`Gender`) → valeur Flowmerce. */
const GENDER_MAP: Record<string, FlowmerceGender> = {
  male:   "Male",
  female: "Female",
};

/**
 * Notre énumération de paiement (Order.paymentMethod) → valeur Flowmerce.
 * Les clés sont normalisées (minuscules, séparateurs → « _ »).
 *
 * Order.paymentMethod est une colonne texte libre : le checkout et le POS n'y
 * écrivent que « cash » ou « card », les autres entrées couvrent les lignes
 * héritées et les moyens de paiement à venir. Une valeur absente de cette table
 * est omise du payload — jamais transmise telle quelle, sinon Flowmerce répond
 * 400 et aucune session n'est créée.
 */
const PAYMENT_METHOD_MAP: Record<string, FlowmercePaymentMethod> = {
  cash:             "Cash on Delivery",
  cash_on_delivery: "Cash on Delivery",
  cod:              "Cash on Delivery",
  card:             "Card",
  ccp:              "CCP",
  bank_transfer:    "Bank Transfer",
};

/** Longueurs maximales imposées par Flowmerce, par champ. */
const MAX_LENGTH = {
  order_id:        200,
  customer_id:     100,
  customer_email:  254,
  customer_name:   200,
  customer_wilaya: 100,
  product_name:    500,
  shipping_method: 100,
} as const;

/**
 * Flowmerce rejette (400) toute valeur contenant du HTML. On refuse donc les
 * chevrons : aucun nom de client, wilaya ou produit légitime n'en contient.
 */
const HTML_CHARS = /[<>]/;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReturnSessionPayload {
  order_id:          string;
  customer_email:    string;
  customer_name:     string;
  product_name:      string;
  customer_id?:      string;
  customer_phone?:   string;
  customer_wilaya?:  string;
  customer_age?:     number;
  customer_gender?:  FlowmerceGender;
  payment_method?:   FlowmercePaymentMethod;
  order_date?:       string;
  product_price?:    number;
  product_quantity?: number;
  order_total?:      number;
  /**
   * Mode et frais de livraison. Ces deux champs ne sont plus jamais demandés
   * au client sur la page de retour : omis, ils sont remplacés par le repli
   * « Standard » / 0, ce qui dégrade le score anti-fraude.
   */
  shipping_method?:  string;
  shipping_cost?:    number;
}

/** Réponse 201 de POST /api/return-sessions. */
export interface ReturnSessionResponse {
  token:      string;
  url:        string;
  expires_at: string;
}

export type OmissionReason = "trop_long" | "html_detecte" | "non_mappable" | "invalide";

/** Champ facultatif écarté du payload — à loguer, jamais silencieux. */
export interface OmittedField {
  field:  string;
  reason: OmissionReason;
  /** Détail utile au diagnostic (longueur constatée, valeur non mappable…). */
  detail?: string;
}

/** Champ obligatoire inutilisable : la session ne peut pas être créée. */
export interface InvalidField {
  field:  string;
  reason: OmissionReason | "manquant";
  detail?: string;
}

export type BuildPayloadResult =
  | { ok: true;  payload: ReturnSessionPayload; omitted: OmittedField[] }
  | { ok: false; invalid: InvalidField;          omitted: OmittedField[] };

/** Données de commande nécessaires à la construction du payload. */
export interface ReturnSessionInput {
  orderId:       string;
  customerId:    string | null;
  email:         string | null;
  name:          string | null;
  phone:         string | null;
  city:          string | null;
  paymentMethod: string | null;
  createdAt:     Date;
  total:         number | null;
  productName:   string;
  productPrice:  number | null;
  quantity:      number | null;
  /** Mode de livraison en clair, ou `null` si inconnu. Voir lib/shipping.ts. */
  shippingMethod: string | null;
  /** Frais de port associés, en DZD. `0` est une valeur significative. */
  shippingCost:   number | null;
  /**
   * Âge du client, calculé depuis sa date de naissance au moment de l'envoi
   * (voir lib/age.ts). `null` si son profil ne la renseigne pas.
   */
  customerAge:    number | null;
  /** Genre du client (`Gender` Prisma), `null` s'il ne l'a pas renseigné. */
  customerGender: string | null;
}

// ─── Normalisation champ par champ ───────────────────────────────────────────

type TextCheck =
  | { ok: true; value: string }
  | { ok: false; reason: OmissionReason | "manquant"; detail?: string };

/**
 * Valide une valeur texte. Ne tronque jamais : au-delà de la limite, le champ
 * est rejeté avec sa longueur réelle pour que l'appelant puisse la loguer.
 */
function checkText(raw: string | null | undefined, maxLength: number): TextCheck {
  if (raw == null) return { ok: false, reason: "manquant" };

  const value = raw.trim();
  if (!value) return { ok: false, reason: "manquant" };

  if (HTML_CHARS.test(value)) return { ok: false, reason: "html_detecte" };

  if (value.length > maxLength) {
    return {
      ok:     false,
      reason: "trop_long",
      detail: `${value.length} caractères pour un maximum de ${maxLength}`,
    };
  }

  return { ok: true, value };
}

/** Contrôle de forme volontairement simple — Flowmerce reste l'autorité. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkEmail(raw: string | null | undefined): TextCheck {
  const text = checkText(raw, MAX_LENGTH.customer_email);
  if (!text.ok) return text;
  if (!EMAIL_RE.test(text.value)) {
    return { ok: false, reason: "invalide", detail: "format d'email invalide" };
  }
  return text;
}

/**
 * Notre valeur interne → valeur Flowmerce, ou `null` si non mappable
 * (le champ est alors omis plutôt qu'envoyé tel quel).
 */
export function mapPaymentMethod(
  internal: string | null | undefined
): FlowmercePaymentMethod | null {
  if (!internal) return null;
  const key = internal.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return PAYMENT_METHOD_MAP[key] ?? null;
}

/** Idem pour le genre : jamais transmis brut, omis si non mappable. */
export function mapGender(internal: string | null | undefined): FlowmerceGender | null {
  if (!internal) return null;
  return GENDER_MAP[internal.trim().toLowerCase()] ?? null;
}

/**
 * Âge plausible. Hors bornes, la donnée est fausse plutôt qu'utile : on
 * l'omet, un âge aberrant dégraderait le score au lieu de l'affiner.
 */
function checkAge(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < MIN_AGE || value > MAX_AGE) return null;
  return value;
}

/** Montant strictement positif, sinon omis. */
function checkPositive(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Quantité : entier strictement positif, sinon omise. */
function checkPositiveInt(value: number | null | undefined): number | null {
  const positive = checkPositive(value);
  if (positive === null || !Number.isInteger(positive)) return null;
  return positive;
}

/**
 * Montant nul ou positif. Réservé aux champs où `0` porte une information —
 * des frais de livraison à `0` disent « offerte », alors qu'un champ absent
 * dit « on ne sait pas » et déclenche un repli côté Flowmerce.
 */
function checkNonNegative(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

// ─── Construction du payload ─────────────────────────────────────────────────

export function buildReturnSessionPayload(input: ReturnSessionInput): BuildPayloadResult {
  const omitted: OmittedField[] = [];

  const record = (field: string, check: { reason: OmissionReason | "manquant"; detail?: string }) => {
    // « manquant » = la donnée n'existe pas en base : c'est nominal, pas une anomalie.
    if (check.reason === "manquant") return;
    omitted.push({ field, reason: check.reason, detail: check.detail });
  };

  // Champs obligatoires — un seul invalide et la session ne peut pas être créée.
  const orderId = checkText(input.orderId, MAX_LENGTH.order_id);
  if (!orderId.ok) return { ok: false, invalid: { field: "order_id", ...orderId }, omitted };

  const email = checkEmail(input.email);
  if (!email.ok) return { ok: false, invalid: { field: "customer_email", ...email }, omitted };

  const name = checkText(input.name, MAX_LENGTH.customer_name);
  if (!name.ok) return { ok: false, invalid: { field: "customer_name", ...name }, omitted };

  const productName = checkText(input.productName, MAX_LENGTH.product_name);
  if (!productName.ok) return { ok: false, invalid: { field: "product_name", ...productName }, omitted };

  const payload: ReturnSessionPayload = {
    order_id:       orderId.value,
    customer_email: email.value,
    customer_name:  name.value,
    product_name:   productName.value,
  };

  // Champs facultatifs — ajoutés seulement si la donnée existe ET est valide.
  const customerId = checkText(input.customerId, MAX_LENGTH.customer_id);
  if (customerId.ok) payload.customer_id = customerId.value;
  else record("customer_id", customerId);

  // Pas de longueur documentée côté Flowmerce : on s'aligne sur la limite du
  // formulaire de commande (20) plutôt que d'en inventer une plus permissive.
  const phone = checkText(input.phone, 20);
  if (phone.ok) payload.customer_phone = phone.value;
  else record("customer_phone", phone);

  const wilaya = checkText(input.city, MAX_LENGTH.customer_wilaya);
  if (wilaya.ok) payload.customer_wilaya = wilaya.value;
  else record("customer_wilaya", wilaya);

  const age = checkAge(input.customerAge);
  if (age !== null) payload.customer_age = age;
  else if (input.customerAge != null) {
    omitted.push({
      field:  "customer_age",
      reason: "invalide",
      detail: `âge « ${input.customerAge} » hors des bornes ${MIN_AGE}-${MAX_AGE}`,
    });
  }

  const gender = mapGender(input.customerGender);
  if (gender) payload.customer_gender = gender;
  else if (input.customerGender) {
    omitted.push({
      field:  "customer_gender",
      reason: "non_mappable",
      detail: `valeur interne « ${input.customerGender} » absente de la table de correspondance`,
    });
  }

  const paymentMethod = mapPaymentMethod(input.paymentMethod);
  if (paymentMethod) payload.payment_method = paymentMethod;
  else if (input.paymentMethod) {
    omitted.push({
      field:  "payment_method",
      reason: "non_mappable",
      detail: `valeur interne « ${input.paymentMethod} » absente de la table de correspondance`,
    });
  }

  // Format date seule (YYYY-MM-DD), conforme à l'exemple de la documentation.
  const orderDate = input.createdAt?.toISOString?.().split("T")[0];
  if (orderDate) payload.order_date = orderDate;

  const price = checkPositive(input.productPrice);
  if (price !== null) payload.product_price = price;

  const quantity = checkPositiveInt(input.quantity);
  if (quantity !== null) payload.product_quantity = quantity;

  // `order_total` est le montant réellement payé, frais de port inclus. Le
  // détail du port reste envoyé à part via `shipping_price`.
  const total = checkPositive(input.total);
  if (total !== null) payload.order_total = total;

  const shippingMethod = checkText(input.shippingMethod, MAX_LENGTH.shipping_method);
  if (shippingMethod.ok) {
    payload.shipping_method = shippingMethod.value;

    // Les frais n'ont de sens qu'accompagnés du mode. `0` est transmis tel
    // quel — c'est « livraison offerte », pas « information absente ».
    const shippingCost = checkNonNegative(input.shippingCost);
    if (shippingCost !== null) payload.shipping_cost = shippingCost;
    else if (input.shippingCost != null) {
      record("shipping_cost", {
        reason: "invalide",
        detail: `montant « ${input.shippingCost} » négatif ou non numérique`,
      });
    }
  } else {
    record("shipping_method", shippingMethod);
  }

  // `expires_in` est volontairement omis : la valeur par défaut du vendeur
  // (72 h) fait autorité. `shop_name` l'est aussi — la clé API identifie déjà
  // la boutique et nous n'avons pas de nom de boutique en configuration.

  return { ok: true, payload, omitted };
}

// ─── Lecture des réponses d'erreur ───────────────────────────────────────────

export type FlowmerceFailure =
  /** 422 RETURN_WINDOW_EXPIRED — cas métier, pas une panne technique. */
  | { kind: "return_window_expired"; message: string }
  /** 400 — payload à corriger de notre côté. */
  | { kind: "bad_request";           message: string }
  /** 401 / 403 — clé API ou compte vendeur : alerter, ne pas retenter. */
  | { kind: "account";               status: number; message: string }
  | { kind: "rate_limited";          message: string }
  | { kind: "unavailable";           status: number; message: string };

interface FlowmerceErrorBody {
  code?:    unknown;
  message?: unknown;
  error?:   unknown;
}

function messageOf(body: FlowmerceErrorBody | null, raw: string, fallback: string): string {
  if (body) {
    if (typeof body.message === "string" && body.message) return body.message;
    if (typeof body.error   === "string" && body.error)   return body.error;
  }
  return raw.trim() || fallback;
}

/** Traduit un statut HTTP + corps brut en cas d'échec typé. */
export function parseReturnSessionFailure(status: number, raw: string): FlowmerceFailure {
  let body: FlowmerceErrorBody | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") body = parsed as FlowmerceErrorBody;
  } catch {
    // corps non JSON : on retombe sur le texte brut
  }

  const message = messageOf(body, raw, `Flowmerce a répondu ${status}`);

  if (status === 422 && body?.code === "RETURN_WINDOW_EXPIRED") {
    return { kind: "return_window_expired", message };
  }
  if (status === 400) return { kind: "bad_request", message };
  if (status === 401 || status === 403) return { kind: "account", status, message };
  if (status === 429) return { kind: "rate_limited", message };

  return { kind: "unavailable", status, message };
}

/** Valide la réponse 201 avant de s'y fier (token/url/expires_at exploitables). */
export function parseReturnSessionResponse(data: unknown): ReturnSessionResponse | null {
  if (!data || typeof data !== "object") return null;

  const { token, url, expires_at } = data as Record<string, unknown>;
  if (typeof token !== "string" || !token) return null;
  if (typeof url !== "string" || !url) return null;
  if (typeof expires_at !== "string" || Number.isNaN(Date.parse(expires_at))) return null;

  return { token, url, expires_at };
}
