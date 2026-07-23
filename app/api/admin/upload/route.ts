import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { apiError } from "@/lib/validation";
import { uploadToSupabase } from "@/lib/storage";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";

  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A
  ) return "image/png";

  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";

  if (
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61
  ) return "image/gif";

  return null;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] ?? "bin";
}

// POST /api/admin/upload — upload an image to Supabase Storage (ADMIN + SELLER)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return apiError("VALIDATION_ERROR", "Requête invalide", 400);
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return apiError("VALIDATION_ERROR", "Aucun fichier fourni", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return apiError("FILE_TOO_LARGE", "La taille maximale est 5 Mo", 400);
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const realMime = detectMimeType(buffer);
  if (!realMime || !ALLOWED_MIME_TYPES.has(realMime)) {
    return apiError(
      "INVALID_FILE_TYPE",
      "Seules les images JPEG, PNG, WebP et GIF sont acceptées",
      400
    );
  }

  try {
    const ext     = extFromMime(realMime);
    const id      = crypto.randomUUID();
    const fileName = `products/${id}.${ext}`;

    const url = await uploadToSupabase(buffer, realMime, fileName);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] Supabase Storage error:", err);
    return apiError("UPLOAD_FAILED", "Échec de l'upload, veuillez réessayer", 500);
  }
}
