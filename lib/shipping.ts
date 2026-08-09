/**
 * Livraison — Yalidine.
 *
 * Ces constantes sont la seule source de vérité : aucune colonne ne porte le
 * transporteur ni le prix de livraison. Elles servent à la fois au calcul du
 * total de commande et aux services tiers (Flowmerce).
 *
 * Conséquence de cette absence de colonne : le tarif est celui d'aujourd'hui,
 * pas celui payé au moment de la commande. `Order.total` reste donc l'autorité
 * sur ce qu'un client a réellement payé — les frais de port ne doivent jamais
 * être recalculés a posteriori sur une commande existante. Les commandes
 * antérieures à cette mise en service ont un total hors livraison.
 */

/** Transporteur unique de la boutique. */
export const SHIPPING_CARRIER = "Yalidine";

/**
 * Tarif forfaitaire national, en DZD (entier, comme tous les montants du
 * schéma). Provisoire : Yalidine facture en réalité par wilaya et selon le
 * mode (domicile / stopdesk).
 */
export const STANDARD_SHIPPING_PRICE = 500;

/**
 * `deliveryType` couvrant une vraie livraison. « store » est la vente au
 * comptoir (POS) : rien n'est expédié, donc aucun frais de port.
 */
const SHIPPED_DELIVERY_TYPES = new Set(["home", "bureau"]);

/**
 * Mode de livraison en clair, par `deliveryType`. C'est cette valeur métier
 * qui part vers les services tiers — jamais le code interne (« bureau »),
 * qu'ils ne savent pas interpréter.
 */
const DELIVERY_METHODS: Record<string, string> = {
  home:   `${SHIPPING_CARRIER} - Domicile`,
  bureau: `${SHIPPING_CARRIER} - Stopdesk`,
  store:  "Retrait en magasin",
};

export interface ShippingDetails {
  /** Mode de livraison en clair, ex. « Yalidine - Stopdesk ». */
  method: string;
  /** Frais de port en DZD, `0` pour un retrait en magasin. */
  price:  number;
}

/**
 * Mode et prix de livraison d'une commande, ou `null` si le `deliveryType`
 * est inconnu — une valeur héritée ne doit pas être transmise telle quelle.
 *
 * Le retrait en magasin renvoie bien un mode, à `0` DA : pour un tiers,
 * « pas de frais » et « frais inconnus » ne sont pas la même information.
 */
export function shippingForOrder(deliveryType: string | null): ShippingDetails | null {
  if (!deliveryType) return null;

  const method = DELIVERY_METHODS[deliveryType];
  if (!method) return null;

  return {
    method,
    price: SHIPPED_DELIVERY_TYPES.has(deliveryType) ? STANDARD_SHIPPING_PRICE : 0,
  };
}

/**
 * Frais de port à ajouter au total d'une commande — `0` pour un retrait en
 * boutique. À utiliser partout où un total est calculé ou affiché, pour que le
 * panier, le checkout et le serveur ne puissent pas diverger.
 */
export function shippingPriceFor(deliveryType: string | null): number {
  return shippingForOrder(deliveryType)?.price ?? 0;
}
