import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
  }

  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }

  const { name } = await req.json();

  // Vérifie si le profil existe déjà
  const userRef = adminDb.collection('users').doc(decoded.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({
      uid: decoded.uid,
      email: decoded.email ?? '',
      name: name ?? 'Utilisateur',
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ uid: decoded.uid }, { status: 201 });
}