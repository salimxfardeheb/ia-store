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
 * comptoir (POS) : rien n'est expédié, aucun transporteur à déclarer.
 */
const SHIPPED_DELIVERY_TYPES = new Set(["home", "bureau"]);

export interface ShippingDetails {
  carrier: string;
  price:   number;
}

/**
 * Transporteur et prix d'une commande, ou `null` si elle n'a pas été livrée
 * (retrait en boutique).
 */
export function shippingForOrder(deliveryType: string | null): ShippingDetails | null {
  if (!deliveryType || !SHIPPED_DELIVERY_TYPES.has(deliveryType)) return null;
  return { carrier: SHIPPING_CARRIER, price: STANDARD_SHIPPING_PRICE };
}

/**
 * Frais de port à ajouter au total d'une commande — `0` pour un retrait en
 * boutique. À utiliser partout où un total est calculé ou affiché, pour que le
 * panier, le checkout et le serveur ne puissent pas diverger.
 */
export function shippingPriceFor(deliveryType: string | null): number {
  return shippingForOrder(deliveryType)?.price ?? 0;
}
