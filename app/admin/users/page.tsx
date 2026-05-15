"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Search, UserRound, AlertCircle, X, Trash2, ChevronDown, Check,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAuth } from "@/app/context/AuthContext";
import { formatDate } from "@/app/variables";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "SELLER";

interface AppUser {
  id:        string;
  name:      string;
  email:     string;
  role:      Role;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:  "Administrateur",
  SELLER: "Vendeur",
};

const ROLE_STYLES: Record<Role, string> = {
  ADMIN:  "bg-black text-white",
  SELLER: "bg-black/10 text-black",
};

// ─── API helpers ──────────────────────────────────────────────────────────────
// Auth porté par le cookie HttpOnly — credentials:'include' suffit.

async function fetchUsers(q = ""): Promise<AppUser[]> {
  const url = `/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

async function createUser(
  data: { name: string; email: string; password: string; role: Role }
): Promise<AppUser> {
  const res = await fetch("/api/admin/users", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? json.error ?? "Erreur");
  return json;
}

async function updateRole(id: string, role: Role): Promise<AppUser> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method:      "PATCH",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ role }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? json.error ?? "Erreur");
  return json;
}

async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method:      "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message ?? json.error ?? "Erreur");
  }
}

// ─── Create User Modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose:   () => void;
  onCreated: (u: AppUser) => void;
}

function CreateUserModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SELLER" as Role });
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim())     { setError("Le nom est requis"); return; }
    if (!form.email.trim())    { setError("L'email est requis"); return; }
    if (form.password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }

    setSaving(true);
    try {
      const user = await createUser({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        role:     form.role,
      });
      onCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif mb-1">
              Gestion des comptes
            </p>
            <h2 className="text-xl font-serif italic">Créer un utilisateur</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-black/30 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[11px] px-3 py-2.5">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Nom complet <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={set("name")}
              placeholder="Prénom Nom"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="email@exemple.com"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Mot de passe <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••  (min. 8 caractères)"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Rôle <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors appearance-none bg-white"
              >
                <option value="SELLER">Vendeur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[rgba(0,0,0,0.12)] text-[10px] uppercase tracking-widest py-2.5 font-serif hover:bg-black/4 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-black text-white text-[10px] uppercase tracking-widest py-2.5 font-serif hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Role Selector ────────────────────────────────────────────────────────────

function RoleSelector({
  user, currentUserId, onUpdated,
}: {
  user: AppUser;
  currentUserId: string;
  onUpdated: (u: AppUser) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const isSelf = user.id === currentUserId;

  const handleSelect = async (role: Role) => {
    if (role === user.role || isSelf) return;
    setOpen(false);
    setBusy(true);
    try {
      const updated = await updateRole(user.id, role);
      onUpdated(updated);
    } catch {
      // silently ignore; could add toast here
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        disabled={isSelf || busy}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-widest font-serif transition-colors ${ROLE_STYLES[user.role]} ${
          isSelf ? "cursor-default" : "cursor-pointer hover:opacity-75"
        } ${busy ? "opacity-50" : ""}`}
      >
        {ROLE_LABELS[user.role]}
        {!isSelf && <ChevronDown size={10} className="shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute left-0 top-full mt-1 z-20 bg-white border border-[rgba(0,0,0,0.1)] shadow-lg min-w-[140px]"
            >
              {(["SELLER", "ADMIN"] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleSelect(role)}
                  className="flex items-center justify-between w-full px-3 py-2 text-[10px] uppercase tracking-widest font-serif hover:bg-black/4 transition-colors"
                >
                  {ROLE_LABELS[role]}
                  {role === user.role && <Check size={10} className="text-black/40" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteButton({
  user, onDeleted,
}: {
  user: AppUser;
  onDeleted: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy]       = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteUser(user.id);
      onDeleted(user.id);
    } catch {
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={busy}
          className="px-2 py-1 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {busy ? "..." : "Confirmer"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-2 py-1 border border-[rgba(0,0,0,0.1)] text-[9px] uppercase tracking-widest font-serif hover:bg-black/5 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 text-black/20 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Supprimer"
    >
      <Trash2 size={13} strokeWidth={1.5} />
    </button>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user, currentUserId, onUpdated, onDeleted,
}: {
  user:          AppUser;
  currentUserId: string;
  onUpdated:     (u: AppUser) => void;
  onDeleted:     (id: string) => void;
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSelf = user.id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-12 items-center px-5 py-4 bg-white border border-[rgba(0,0,0,0.06)] hover:border-black/20 transition-colors"
    >
      {/* Avatar + name */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-serif shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-serif font-medium truncate">
            {user.name}
            {isSelf && (
              <span className="ml-2 text-[9px] text-black/30 font-serif normal-case italic">
                (vous)
              </span>
            )}
          </p>
          <p className="text-[10px] text-black/40 font-serif truncate">{user.email}</p>
        </div>
      </div>

      {/* Role selector */}
      <div className="col-span-3">
        <RoleSelector
          user={user}
          currentUserId={currentUserId}
          onUpdated={onUpdated}
        />
      </div>

      {/* Created at */}
      <div className="col-span-4 text-[10px] text-black/30 font-serif">
        {formatDate(user.createdAt)}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex justify-end">
        {!isSelf && (
          <DeleteButton user={user} onDeleted={onDeleted} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]     = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleCreated = (u: AppUser) => {
    setUsers((prev) => [u, ...prev]);
    setShowModal(false);
  };

  const handleUpdated = (u: AppUser) =>
    setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));

  const handleDeleted = (id: string) =>
    setUsers((prev) => prev.filter((x) => x.id !== id));

  return (
    <div>
      <AdminHeader title="Comptes" subtitle="Gestion des utilisateurs" />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={13}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full border border-[rgba(0,0,0,0.08)] bg-white text-[11px] py-2.5 pl-9 pr-4 font-serif focus:outline-none focus:border-black/30 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-black/30 font-serif">
            {users.length} compte{users.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest px-4 py-2.5 font-serif hover:bg-black/80 transition-colors"
          >
            <Plus size={13} strokeWidth={1.5} />
            Nouveau compte
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-5 py-2 mb-2">
        {[
          { label: "Utilisateur", span: "col-span-4" },
          { label: "Rôle",        span: "col-span-3" },
          { label: "Créé le",     span: "col-span-4" },
          { label: "",            span: "col-span-1" },
        ].map(({ label, span }) => (
          <div
            key={label}
            className={`${span} text-[9px] uppercase tracking-[0.3em] text-black/25 font-serif`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-24">
          <p className="font-serif italic text-black/20">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-black/10">
          <UserRound size={32} strokeWidth={0.75} className="text-black/10 mx-auto mb-4" />
          <p className="font-serif italic text-black/20">
            {search ? "Aucun utilisateur trouvé" : "Aucun utilisateur enregistré"}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                currentUserId={me?.id ?? ""}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CreateUserModal
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
