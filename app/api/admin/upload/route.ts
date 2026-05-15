import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { apiError } from "@/lib/validation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Allowed MIME types — validated against magic bytes, not the client-supplied Content-Type
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Detect the real MIME type from the first bytes of the file buffer.
 * Returns null if the bytes don't match a known image signature.
 */
function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A
  ) return "image/png";

  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";

  // GIF87a or GIF89a
  if (
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61
  ) return "image/gif";

  return null;
}

// POST /api/admin/upload — upload an image to Cloudinary (ADMIN + SELLER)
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return apiError("VALIDATION_ERROR", "Requête invalide", 400);
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return apiError("VALIDATION_ERROR", "Aucun fichier fourni", 400);
  }

  // Validate file size before reading into memory
  if (file.size > MAX_FILE_SIZE) {
    return apiError("FILE_TOO_LARGE", "La taille maximale est 5 Mo", 400);
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate real file type via magic bytes — never trust the client-supplied MIME
  const realMime = detectMimeType(buffer);
  if (!realMime || !ALLOWED_MIME_TYPES.has(realMime)) {
    return apiError(
      "INVALID_FILE_TYPE",
      "Seules les images JPEG, PNG, WebP et GIF sont acceptées",
      400
    );
  }

  // upload_stream évite l'encodage base64 (+33% RAM/CPU) imposé par upload(dataUri).
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "ia-store", resource_type: "image" },
        (error, uploaded) => {
          if (error || !uploaded) reject(error ?? new Error("Upload failed"));
          else resolve(uploaded);
        }
      );
      Readable.from(buffer).pipe(stream);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch {
    return apiError("UPLOAD_FAILED", "Échec de l'upload, veuillez réessayer", 500);
  }
}
