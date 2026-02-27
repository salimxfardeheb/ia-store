import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
  }

  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) {
    return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
  }

  // Récupérer le profil depuis Firestore
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  return NextResponse.json({ user: userSnap.data() });
}