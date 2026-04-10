import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// POST /api/admin/upload — upload une image vers Cloudinary, retourne l'URL sécurisée
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Conversion en data URI base64 pour l'API Cloudinary
  const mime = file.type || "image/jpeg";
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "ia-store",
    resource_type: "image",
  });

  return NextResponse.json({ url: result.secure_url });
}
