"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, name, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl luxury-shadow border border-black/5"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl italic mb-2">Rejoindre I.A</h1>
          <p className="text-black/60 text-sm uppercase tracking-widest">Créer votre compte</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs mb-6 text-center uppercase tracking-widest font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Nom complet</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#fdfcfb] border border-black/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="ex :Mohammed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Adresse e-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fdfcfb] border border-black/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fdfcfb] border border-black/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <span>{loading ? 'Création en cours...' : 'Créer mon compte'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-black/60">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-black font-bold border-b border-black/20 hover:border-black transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
