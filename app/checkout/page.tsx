"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { createOrder, OrderForm } from "@/app/firebase/orders";
import { getProfile } from "@/app/firebase/profile";
import { WILAYAS } from "../variables";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Check,
  Banknote,
  CreditCard,
  Home,
  Building2,
  Lock,
} from "lucide-react";



export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<OrderForm>({
    fullName: profile?.name ?? "",
    phone: "",
    city: "",
    address: "",
    postalCode: "",
    paymentMethod: "cash",
    deliveryType: "home",
  });

useEffect(() => {
  if (!user) return;
  const load = async () => {
    const data = await getProfile(user.uid);
    if (data)
      setForm((prev) => ({
        ...prev,
        fullName: profile?.name ?? prev.fullName,
        phone: data.phone ?? "",
        city: data.city ?? "",
        address: data.address ?? "",
        postalCode: data.postalCode ?? "",
      }));
  };
  load();
}, [user]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  const set = (key: keyof OrderForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isValid =
    form.fullName.trim() &&
    form.phone.trim() &&
    form.city &&
    form.address.trim() &&
    form.postalCode.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting || !user?.uid) return;
    setSubmitting(true);
    try {
      const id = await createOrder(user.uid,{
        form,
        items: cart,
        total: cartTotal,
      });
      setOrderId(id);
      setSuccess(true);
      clearCart();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Panier vide
  if (cart.length === 0 && !success) {
    return (
      <div className="pt-48 pb-24 px-6 max-w-7xl mx-auto text-center">
        <ShoppingBag
          size={40}
          strokeWidth={0.75}
          className="opacity-15 mx-auto mb-8"
        />
        <h1 className="font-serif text-4xl italic mb-6">
          Votre panier est vide
        </h1>
        <Link
          href="/shop"
          className="bg-black text-white px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all inline-block"
        >
          Continuer mes achats
        </Link>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-48 pb-24 px-6 max-w-lg mx-auto text-center"
      >
        <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-8">
          <Check size={24} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-4xl italic mb-4">Commande confirmée</h1>
        <p className="text-black/40 text-sm font-light mb-2">
          Merci pour votre commande.
        </p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-black/25 font-serif mb-12">
          Réf. {orderId}
        </p>
        <Link
          href="/shop"
          className="bg-black text-white px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all inline-block"
        >
          Continuer mes achats
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold mb-12 opacity-40 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </button>

      <h1 className="font-serif text-5xl italic mb-16">
        Finaliser la commande
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-10">
          {/* Bannière non connecté */}
          {!user && (
            <div className="border border-black/8 px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-black/40 font-serif">
                Connectez-vous pour suivre vos commandes
              </p>
              <Link
                href="/login"
                className="text-[9px] uppercase tracking-widest font-bold border-b border-black pb-0.5 hover:opacity-60 transition-opacity shrink-0 ml-6"
              >
                Se connecter
              </Link>
            </div>
          )}

          {/* Coordonnées */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif mb-6 pb-4 border-b border-black/8">
              Coordonnées
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                  Nom & Prénom
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ex : Karim Benali"
                  className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="Ex : 0555 000 000"
                  className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif mb-6 pb-4 border-b border-black/8">
              Adresse de livraison
            </p>
            <div className="space-y-4">
              {/* Wilaya */}
              <div>
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                  Wilaya
                </label>
                <div className="relative">
                  <select
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors appearance-none"
                  >
                    <option value="">Sélectionner une wilaya</option>
                    {WILAYAS.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none text-xs">
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                  Adresse
                </label>
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Ex : 12 Rue Didouche Mourad"
                  className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                  Code Postal
                </label>
                <input
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  placeholder="Ex : 31000"
                  className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Type de livraison */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif mb-6 pb-4 border-b border-black/8">
              Type de livraison
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: "home",
                  label: "À domicile",
                  sub: "Livré chez vous",
                  icon: Home,
                },
                {
                  value: "bureau",
                  label: "Bureau de livraison",
                  sub: "Retrait en agence",
                  icon: Building2,
                },
              ].map(({ value, label, sub, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("deliveryType", value)}
                  className={`border p-4 text-left transition-all ${
                    form.deliveryType === value
                      ? "border-black bg-black text-white"
                      : "border-black/8 hover:border-black/30"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={`mb-3 ${form.deliveryType === value ? "text-white" : "text-black/30"}`}
                  />
                  <p
                    className={`text-[11px] uppercase tracking-widest font-bold font-serif ${form.deliveryType === value ? "text-white" : "text-black"}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-[9px] mt-0.5 font-serif ${form.deliveryType === value ? "text-white/60" : "text-black/30"}`}
                  >
                    {sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Paiement */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif mb-6 pb-4 border-b border-black/8">
              Mode de paiement
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: "cash",
                  label: "Cash on delivery",
                  sub: "Paiement à la livraison",
                  icon: Banknote,
                  disabled: false,
                },
                {
                  value: "card",
                  label: "Paiement par carte",
                  sub: "Disponible prochainement",
                  icon: CreditCard,
                  disabled: true,
                },
              ].map(({ value, label, sub, icon: Icon, disabled }) => (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && set("paymentMethod", value)}
                  className={`border p-4 text-left transition-all relative ${
                    disabled
                      ? "border-black/5 opacity-40 cursor-not-allowed"
                      : form.paymentMethod === value
                        ? "border-black bg-black text-white"
                        : "border-black/8 hover:border-black/30"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={`mb-3 ${form.paymentMethod === value && !disabled ? "text-white" : "text-black/30"}`}
                  />
                  <p
                    className={`text-[11px] uppercase tracking-widest font-bold font-serif ${form.paymentMethod === value && !disabled ? "text-white" : "text-black"}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-[9px] mt-0.5 font-serif ${form.paymentMethod === value && !disabled ? "text-white/60" : "text-black/30"}`}
                  >
                    {sub}
                  </p>
                  {disabled && (
                    <div className="absolute top-3 right-3">
                      <Lock size={10} className="text-black/20" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Résumé commande */}
        <div className="lg:col-span-1">
          <div className="border border-black/8 p-8 sticky top-32">
            <h2 className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif mb-6">
              Résumé
            </h2>

            {/* Articles */}
            <div className="space-y-4 mb-6 border-b border-black/8 pb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 aspect-3/4 bg-[#f5f5f5] overflow-hidden shrink-0">
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grow">
                    <p className="font-serif text-sm italic leading-snug">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-black/30 uppercase tracking-widest">
                      x{item.quantity}
                    </p>
                  </div>
                  <span className="font-serif text-sm italic shrink-0">
                    {(item.price * item.quantity).toLocaleString("fr-FR")} DA
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-black/40 font-light">Sous-total</span>
                <span className="font-serif italic">
                  {cartTotal.toLocaleString("fr-FR")} DA
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40 font-light">Livraison</span>
                <span className="text-[9px] uppercase tracking-widest text-black/30 font-serif">
                  À confirmer
                </span>
              </div>
              <div className="pt-4 border-t border-black/8 flex justify-between items-baseline">
                <span className="font-serif text-xl italic">Total</span>
                <span className="font-serif text-xl italic">
                  {cartTotal.toLocaleString("fr-FR")} DA
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={`w-full py-5 text-[11px] uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-3 ${
                !isValid || submitting
                  ? "bg-black/20 text-white cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              {submitting ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <span>Confirmer la commande</span>
                  <ArrowRight size={16} strokeWidth={1.5} />
                </>
              )}
            </button>

            <p className="text-[8px] text-center mt-6 text-black/20 uppercase tracking-[0.3em] font-serif">
              Paiement sécurisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
