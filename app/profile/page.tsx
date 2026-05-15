"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { getProfile, saveProfile, changePassword } from "@/services/profile";
import { Profile, WILAYAS } from "../variables";
import { useRouter } from "next/navigation";
import { User, MapPin, Phone, Hash, Check, LogOut, ClockArrowUp, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Omit<Profile, "uid">>({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    postalCode: "",
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "" });
  const [pwState, setPwState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    getProfile().then((data) => {
      if (data) setForm({ name: data.name, email: data.email, phone: data.phone, city: data.city, address: data.address, postalCode: data.postalCode });
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile({ phone: form.phone, city: form.city, address: form.address, postalCode: form.postalCode });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    if (pwForm.next.length < 8) {
      setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (pwForm.current === pwForm.next) {
      setPwError("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }
    setPwState("saving");
    setPwError("");
    const result = await changePassword(pwForm.current, pwForm.next);
    if ("error" in result) {
      setPwError(result.error);
      setPwState("error");
    } else {
      setPwState("success");
      setPwForm({ current: "", next: "" });
      setTimeout(() => setPwState("idle"), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="font-serif italic text-black/30 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-16">
        <div>
          <h1 className="font-serif text-5xl italic mb-2">Mon Profil</h1>
          <p className="text-black/30 text-[11px] uppercase tracking-[0.3em]">
            {profile?.email ?? user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/30 hover:text-black transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* ── Historique des commandes ── */}
      <motion.button
        onClick={() => router.push("/orders")}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full mb-12 flex items-center justify-between border border-black/10 px-5 py-4 hover:border-black/30 hover:bg-black/2 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 border border-black/10 flex items-center justify-center group-hover:border-black/30 transition-colors">
            <ClockArrowUp size={15} strokeWidth={1.5} className="text-black/40 group-hover:text-black/70 transition-colors" />
          </div>
          <div className="text-left">
            <p className="font-serif text-sm text-black/80">Historique des commandes</p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-black/30 mt-0.5">Suivre · Signaler · Gérer</p>
          </div>
        </div>
        <span className="text-black/20 group-hover:text-black/50 transition-colors text-lg font-light">→</span>
      </motion.button>

      {/* Section — Infos compte */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b border-black/8 pb-4">
          <User size={14} strokeWidth={1.5} className="text-black/30" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif">
            Informations du compte
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Nom
            </label>
            <div className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F2F0ED] text-black/40 font-serif italic select-none">
              {profile?.name ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Email
            </label>
            <div className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F2F0ED] text-black/40 font-serif italic select-none">
              {user?.email ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Section — Coordonnées */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b border-black/8 pb-4">
          <MapPin size={14} strokeWidth={1.5} className="text-black/30" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif">
            Coordonnées
          </span>
        </div>

        <div className="space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Téléphone
            </label>
            <div className="relative">
              <Phone size={12} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ex : +213 555 000 000"
                className="w-full border border-black/8 text-sm py-2.5 pl-8 pr-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Adresse
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ex : 12 Rue Didouche Mourad"
              className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* City + Postal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Wilaya
              </label>
              <div className="relative">
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="">Sélectionner</option>
                  {WILAYAS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none text-xs">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Code Postal
              </label>
              <div className="relative">
                <Hash size={12} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="Ex : 31000"
                  className="w-full border border-black/8 text-sm py-2.5 pl-8 pr-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section — Changer le mot de passe */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b border-black/8 pb-4">
          <KeyRound size={14} strokeWidth={1.5} className="text-black/30" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-black/40 font-serif">
            Changer le mot de passe
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              placeholder="••••••••"
              className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              placeholder="••••••••  (min. 8 caractères)"
              className="w-full border border-black/8 text-sm py-2.5 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {pwError && (
            <p className="text-[10px] text-red-600 font-serif">{pwError}</p>
          )}

          <motion.button
            onClick={handleChangePassword}
            disabled={pwState === "saving" || !pwForm.current || !pwForm.next}
            animate={{ opacity: pwState === "saving" ? 0.6 : 1 }}
            className="w-full border border-black/20 text-black py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-black hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pwState === "success" ? (
              <>
                <Check size={14} strokeWidth={2} />
                <span>Mot de passe modifié</span>
              </>
            ) : pwState === "saving" ? (
              <span>Modification...</span>
            ) : (
              <span>Modifier le mot de passe</span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        animate={{ opacity: saving ? 0.6 : 1 }}
        className="w-full bg-black text-white py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center gap-3"
      >
        {saved ? (
          <>
            <Check size={16} strokeWidth={2} />
            <span>Enregistré</span>
          </>
        ) : saving ? (
          <span>Enregistrement...</span>
        ) : (
          <span>Enregistrer le profil</span>
        )}
      </motion.button>

    </div>
  );
}