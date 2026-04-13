"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Minus, Trash2, Check, X, ShoppingCart,
  User, AlertCircle, CreditCard, Banknote, ChevronRight,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { Product, PosCartItem } from "@/app/variables";
import type { UnifiedCustomer } from "@/app/api/admin/customers/route";
import { getAllProducts as getShopProducts } from "@/services/products";
import { getCustomers, createOfflineSale } from "@/services/admin";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// ─── Size Picker Modal ────────────────────────────────────────────────────────

function SizePickerModal({
  product,
  onConfirm,
  onClose,
}: {
  product: Product;
  onConfirm: (size: string, maxStock: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const availableSizes = product.sizes.filter((s) => s.quantity > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white w-full max-w-xs shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif mb-1">
              Choisir la taille
            </p>
            <p className="font-serif font-medium text-sm">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-black/30 hover:text-black">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {availableSizes.map(({ size, quantity }) => (
            <button
              key={size}
              onClick={() => setSelected(size)}
              className={`w-12 h-12 border text-xs font-serif transition-all ${
                selected === size
                  ? "bg-black text-white border-black"
                  : "border-black/15 hover:border-black"
              }`}
              title={`${quantity} en stock`}
            >
              {size}
            </button>
          ))}
          {availableSizes.length === 0 && (
            <p className="text-[11px] text-black/40 font-serif italic">
              Rupture de stock
            </p>
          )}
        </div>

        <button
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            const maxStock =
              product.sizes.find((s) => s.size === selected)?.quantity ?? 0;
            onConfirm(selected, maxStock);
          }}
          className="w-full bg-black text-white text-[10px] uppercase tracking-widest py-2.5 font-serif disabled:opacity-30 hover:bg-black/80 transition-colors"
        >
          Ajouter au panier
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const outOfStock = product.stock === 0;

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`relative text-left border p-3 transition-all group ${
        outOfStock
          ? "opacity-40 cursor-not-allowed border-[rgba(0,0,0,0.06)]"
          : "border-[rgba(0,0,0,0.08)] hover:border-black/40 hover:shadow-sm"
      }`}
    >
      <div className="aspect-square w-full bg-[#F7F7F7] mb-2.5 overflow-hidden">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/10">
            <ShoppingCart size={20} strokeWidth={1} />
          </div>
        )}
      </div>

      <p className="text-[11px] font-serif font-medium leading-snug mb-1 line-clamp-2">
        {product.name}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-serif">{product.price.toLocaleString("fr-DZ")} DA</span>
        <span className="text-[9px] text-black/30 font-serif">{product.stock} dispo</span>
      </div>

      {outOfStock && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] uppercase tracking-widest font-serif text-black/40 bg-white/80 px-2 py-1">
            Épuisé
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: PosCartItem;
  onQtyChange: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[rgba(0,0,0,0.06)] last:border-0">
      <div className="w-10 h-10 bg-[#F7F7F7] shrink-0 overflow-hidden">
        {item.mainImage && (
          <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-serif font-medium truncate">{item.name}</p>
        {item.size && (
          <p className="text-[9px] text-black/40 font-serif uppercase tracking-widest">{item.size}</p>
        )}
        <p className="text-[11px] text-black/60 font-serif">
          {(item.price * item.quantity).toLocaleString("fr-DZ")} DA
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(-1)}
          className="w-6 h-6 border border-[rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-black hover:text-white transition-colors"
        >
          <Minus size={10} strokeWidth={2} />
        </button>
        <span className="w-7 text-center text-[11px] font-serif">{item.quantity}</span>
        <button
          onClick={() => onQtyChange(1)}
          disabled={item.quantity >= item.maxStock}
          className="w-6 h-6 border border-[rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-25"
        >
          <Plus size={10} strokeWidth={2} />
        </button>
      </div>

      <button
        onClick={onRemove}
        className="text-black/20 hover:text-red-500 transition-colors p-1"
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── POS Page ─────────────────────────────────────────────────────────────────

export default function PosPage() {
  const { getToken, user, isLoading } = useAuth();
  const router = useRouter();
  const token  = getToken() ?? "";

  // Products
  const [products,       setProducts]       = useState<Product[]>([]);
  const [productSearch,  setProductSearch]  = useState("");

  // Customer
  const [customerSearch,    setCustomerSearch]    = useState("");
  const [customerResults,   setCustomerResults]   = useState<UnifiedCustomer[]>([]);
  const [selectedCustomer,  setSelectedCustomer]  = useState<UnifiedCustomer | null>(null);
  const [showNewCustomer,   setShowNewCustomer]   = useState(false);
  const [newCustomerForm,   setNewCustomerForm]   = useState({ name: "", phone: "", email: "", address: "" });
  const [customerSearching, setCustomerSearching] = useState(false);

  // Cart
  const [cart,          setCart]    = useState<PosCartItem[]>([]);
  const [paymentMethod, setPayment] = useState<"cash" | "card">("cash");

  // Size picker
  const [sizePicker, setSizePicker] = useState<Product | null>(null);

  // Sale
  const [confirming,        setConfirming]        = useState(false);
  const [saleError,         setSaleError]         = useState("");
  const [confirmedOrderId,  setConfirmedOrderId]  = useState<string | null>(null);

  // Prevent double-submit — useRef is synchronous unlike useState
  const isSubmitting = useRef(false);

  const isAuthorized = !isLoading && !!user && user.role !== "CLIENT";

  // ── Auth guard: redirect when auth state is resolved ──
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role === "CLIENT") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  // ── Load active products once the user is authorised ──
  useEffect(() => {
    if (!isAuthorized) return;
    getShopProducts().then(setProducts);
  }, [isAuthorized]);

  // ── Debounced customer search ──
  useEffect(() => {
    if (!isAuthorized || !customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setCustomerSearching(true);
      const results = await getCustomers(token, customerSearch);
      setCustomerResults(results);
      setCustomerSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [isAuthorized, customerSearch, token]);

  // ── Cart helpers (hooks must be declared before any conditional return) ──

  const addToCart = useCallback((product: Product, size?: string, maxStock?: number) => {
    const key = `${product.id}::${size ?? ""}`;
    setCart((prev) => {
      const existing = prev.find((i) => `${i.productId}::${i.size ?? ""}` === key);
      const stock    = maxStock ?? product.stock;
      if (existing) {
        return prev.map((i) =>
          `${i.productId}::${i.size ?? ""}` === key
            ? { ...i, quantity: Math.min(i.quantity + 1, stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name:      product.name,
          price:     product.price,
          quantity:  1,
          size,
          mainImage: product.mainImage,
          category:  product.category,
          maxStock:  stock,
        },
      ];
    });
  }, []);

  // Show nothing while auth resolves or user is not allowed (after all hooks)
  if (!isAuthorized) return null;

  // ── Filtered products ──
  const filteredProducts = products.filter((p) => {
    if (p.status !== "Actif") return false;
    if (!productSearch) return true;
    return p.name.toLowerCase().includes(productSearch.toLowerCase());
  });

  const handleProductClick = (product: Product) => {
    if (product.sizes.length > 0) {
      setSizePicker(product);
    } else {
      addToCart(product);
    }
  };

  const handleQtyChange = (productId: string, size: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: Math.max(0, Math.min(i.quantity + delta, i.maxStock)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string, size: string | undefined) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Customer helpers ──

  const setNewCustomerField =
    (field: keyof typeof newCustomerForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewCustomerForm((f) => ({ ...f, [field]: e.target.value }));

  const handleConfirmNewCustomer = () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) return;
    // Build a synthetic UnifiedCustomer from the form (no DB write needed)
    const synthetic: UnifiedCustomer = {
      id:          `new:${newCustomerForm.phone.trim()}`,
      name:        newCustomerForm.name.trim(),
      phone:       newCustomerForm.phone.trim(),
      email:       newCustomerForm.email.trim() || null,
      address:     newCustomerForm.address.trim() || null,
      channel:     "offline",
      ordersCount: 0,
      lastOrderAt: null,
      createdAt:   new Date().toISOString(),
    };
    setSelectedCustomer(synthetic);
    setShowNewCustomer(false);
    setCustomerSearch("");
    setCustomerResults([]);
  };

  // ── Confirm sale ──

  const handleConfirmSale = async () => {
    // Synchronous ref guard prevents double-submit even before state re-renders
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setSaleError("");

    if (!cart.length) {
      setSaleError("Le panier est vide");
      isSubmitting.current = false;
      return;
    }

    if (!selectedCustomer) {
      setSaleError("Veuillez sélectionner ou créer un client");
      isSubmitting.current = false;
      return;
    }

    setConfirming(true);
    try {
      const { id } = await createOfflineSale(token, {
        customer: {
          name:    selectedCustomer.name,
          phone:   selectedCustomer.phone ?? "",
          email:   selectedCustomer.email   ?? undefined,
          address: selectedCustomer.address ?? undefined,
        },
        items: cart,
        paymentMethod,
        total: cartTotal,
      });
      setConfirmedOrderId(id);
    } catch (err) {
      setSaleError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setConfirming(false);
      isSubmitting.current = false;
    }
  };

  const resetSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
    setShowNewCustomer(false);
    setPayment("cash");
    setSaleError("");
    setConfirmedOrderId(null);
  };

  // ── Success screen ──

  if (confirmedOrderId) {
    return (
      <div>
        <AdminHeader title="Vente confirmée" subtitle="Point de vente" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
            <Check size={28} strokeWidth={1.5} className="text-white" />
          </div>
          <h2 className="font-serif italic text-3xl mb-3">Vente enregistrée</h2>
          <p className="text-[11px] uppercase tracking-widest text-black/40 font-serif mb-1">
            Référence commande
          </p>
          <p className="font-mono text-sm text-black/60 mb-8">{confirmedOrderId}</p>
          <div className="flex gap-3">
            <button
              onClick={resetSale}
              className="bg-black text-white text-[10px] uppercase tracking-widest px-6 py-3 font-serif hover:bg-black/80 transition-colors"
            >
              Nouvelle vente
            </button>
            <button
              onClick={() => router.push("/admin/orders")}
              className="border border-[rgba(0,0,0,0.12)] text-[10px] uppercase tracking-widest px-6 py-3 font-serif hover:bg-black/4 transition-colors"
            >
              Voir les commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Nouvelle vente" subtitle="Point de vente" />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div className="col-span-8 space-y-5">

          {/* Customer section */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] p-5">
            <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif mb-4">
              Client
            </p>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-black/4 border border-black/8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-serif">
                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px] font-serif font-medium">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-black/40 font-serif">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                  className="text-black/30 hover:text-black p-1"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : showNewCustomer ? (
              <div className="space-y-3">
                <p className="text-[10px] text-black/50 font-serif">Nouveau client</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newCustomerForm.name}
                    onChange={setNewCustomerField("name")}
                    placeholder="Nom complet *"
                    className="border border-[rgba(0,0,0,0.12)] text-[11px] py-2 px-3 font-serif focus:outline-none focus:border-black transition-colors"
                  />
                  <input
                    value={newCustomerForm.phone}
                    onChange={setNewCustomerField("phone")}
                    placeholder="Téléphone *"
                    type="tel"
                    className="border border-[rgba(0,0,0,0.12)] text-[11px] py-2 px-3 font-serif focus:outline-none focus:border-black transition-colors"
                  />
                  <input
                    value={newCustomerForm.email}
                    onChange={setNewCustomerField("email")}
                    placeholder="Email (optionnel)"
                    className="border border-[rgba(0,0,0,0.12)] text-[11px] py-2 px-3 font-serif focus:outline-none focus:border-black transition-colors"
                  />
                  <input
                    value={newCustomerForm.address}
                    onChange={setNewCustomerField("address")}
                    placeholder="Adresse (optionnel)"
                    className="border border-[rgba(0,0,0,0.12)] text-[11px] py-2 px-3 font-serif focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmNewCustomer}
                    disabled={!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()}
                    className="text-[10px] uppercase tracking-widest bg-black text-white px-4 py-2 font-serif disabled:opacity-30 hover:bg-black/80 transition-colors"
                  >
                    Créer
                  </button>
                  <button
                    onClick={() => setShowNewCustomer(false)}
                    className="text-[10px] uppercase tracking-widest border border-[rgba(0,0,0,0.12)] px-4 py-2 font-serif hover:bg-black/4 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    size={13}
                    strokeWidth={1.5}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
                  />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Rechercher par nom ou téléphone..."
                    className="w-full border border-[rgba(0,0,0,0.08)] text-[11px] py-2.5 pl-9 pr-4 font-serif focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <AnimatePresence>
                  {customerResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border border-[rgba(0,0,0,0.08)] bg-white divide-y divide-[rgba(0,0,0,0.05)] max-h-44 overflow-y-auto"
                    >
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomerResults([]); }}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                        >
                          <div>
                            <p className="text-[12px] font-serif">{c.name}</p>
                            <p className="text-[10px] text-black/40 font-serif">{c.phone}</p>
                          </div>
                          <ChevronRight size={13} className="text-black/20" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                  {customerSearch && !customerSearching && customerResults.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between px-4 py-3 border border-dashed border-[rgba(0,0,0,0.1)] text-[11px] text-black/40 font-serif"
                    >
                      <span>Aucun client trouvé</span>
                      <button
                        onClick={() => setShowNewCustomer(true)}
                        className="flex items-center gap-1.5 text-black hover:underline"
                      >
                        <Plus size={12} strokeWidth={2} />
                        Créer
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!customerSearch && (
                  <button
                    onClick={() => setShowNewCustomer(true)}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/40 hover:text-black font-serif transition-colors"
                  >
                    <Plus size={12} strokeWidth={2} />
                    Nouveau client
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Products section */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif">
                Produits
              </p>
              <div className="relative w-52">
                <Search
                  size={12}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
                />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full border border-[rgba(0,0,0,0.08)] text-[11px] py-2 pl-8 pr-3 font-serif focus:outline-none focus:border-black/30 transition-colors"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-black/20 font-serif italic text-sm">
                {productSearch ? "Aucun produit trouvé" : "Aucun produit actif"}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={handleProductClick} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (cart) ─────────────────────────────── */}
        <div className="col-span-4 sticky top-8 space-y-4">
          <div className="bg-white border border-[rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif">
                Panier
              </p>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[9px] uppercase tracking-widest text-black/30 hover:text-red-500 font-serif transition-colors"
                >
                  Vider
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-black/15">
                <ShoppingCart size={28} strokeWidth={0.75} className="mx-auto mb-3" />
                <p className="font-serif italic text-sm">Panier vide</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
                {cart.map((item) => (
                  <CartRow
                    key={`${item.productId}::${item.size ?? ""}`}
                    item={item}
                    onQtyChange={(delta) => handleQtyChange(item.productId, item.size, delta)}
                    onRemove={() => removeFromCart(item.productId, item.size)}
                  />
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-black/40 font-serif">Total</span>
                  <span className="text-xl font-serif italic">
                    {cartTotal.toLocaleString("fr-DZ")} DA
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-serif mb-2">
                    Règlement
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cash", "card"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPayment(m)}
                        className={`flex items-center justify-center gap-2 py-2.5 border text-[10px] uppercase tracking-widest font-serif transition-all ${
                          paymentMethod === m
                            ? "bg-black text-white border-black"
                            : "border-[rgba(0,0,0,0.12)] hover:border-black/30"
                        }`}
                      >
                        {m === "cash"
                          ? <Banknote size={13} strokeWidth={1.5} />
                          : <CreditCard size={13} strokeWidth={1.5} />}
                        {m === "cash" ? "Espèces" : "Carte"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {saleError && (
              <div className="mt-3 flex items-start gap-2 text-red-600 text-[11px] font-serif bg-red-50 border border-red-100 px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 mt-px" />
                {saleError}
              </div>
            )}

            <button
              onClick={handleConfirmSale}
              disabled={confirming || cart.length === 0}
              className="mt-4 w-full bg-black text-white text-[10px] uppercase tracking-widest py-3.5 font-serif hover:bg-black/80 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {confirming ? (
                "Confirmation..."
              ) : (
                <>
                  <Check size={14} strokeWidth={2} />
                  Confirmer la vente
                </>
              )}
            </button>
          </div>

          {selectedCustomer && (
            <div className="bg-white border border-[rgba(0,0,0,0.08)] p-4 flex items-center gap-3">
              <div className="w-7 h-7 bg-black/8 flex items-center justify-center shrink-0">
                <User size={13} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-serif font-medium truncate">{selectedCustomer.name}</p>
                <p className="text-[10px] text-black/40 font-serif">{selectedCustomer.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sizePicker && (
          <SizePickerModal
            product={sizePicker}
            onConfirm={(size, maxStock) => {
              addToCart(sizePicker, size, maxStock);
              setSizePicker(null);
            }}
            onClose={() => setSizePicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
