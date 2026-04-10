import { OrderStatus } from "@/app/variables";

// Transitions valides : de quel statut peut-on passer à quel autre
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped",   "cancelled"],
  shipped:   ["delivered", "cancelled"],
  delivered: ["returned"],  // retour possible après livraison
  cancelled: [],            // état final
  returned:  [],            // état final
};

/** Vérifie si la transition `from → to` est autorisée */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Retourne les statuts accessibles depuis `from` */
export function getAllowedTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}
