/**
 * Cloudinary — upload d'images (signé, côté serveur uniquement).
 *
 * L'upload est signé avec l'API secret : la signature est le SHA-1 des
 * paramètres signés triés par clé, concaténés en query-string, suivis du
 * secret. `file`, `api_key` et `resource_type` sont exclus de la signature.
 *
 * Pas de SDK : l'endpoint d'upload est un simple POST multipart/form-data et
 * la dépendance officielle tirerait tout un client Node dans le bundle serveur
 * pour cette unique fonction.
 *
 * Le compte Cloudinary est partagé avec d'autres projets : tout ce que le
 * store écrit est confiné sous `UPLOAD_FOLDER`, jamais à la racine.
 *
 * Le compte est en mode « dynamic folders » : c'est `asset_folder` qui range
 * l'image dans la médiathèque, PAS les slashes du `public_id` (qui n'y sont
 * qu'un nom). Sans lui, l'upload atterrit à la racine, mélangé aux autres
 * projets — on envoie donc les deux, et ils pointent au même endroit.
 */

import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const UPLOAD_FOLDER = "ia-store/products";

function signParams(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + API_SECRET).digest("hex");
}

/**
 * Envoie `buffer` sur Cloudinary et renvoie l'URL publique (HTTPS) du média.
 *
 * `publicId` est le nom du fichier SANS extension : Cloudinary la déduit du
 * contenu et l'ajoute lui-même à l'URL renvoyée.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  publicId: string,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signed = {
    asset_folder: UPLOAD_FOLDER,
    public_id:    `${UPLOAD_FOLDER}/${publicId}`,
    timestamp,
  };

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }));
  for (const [key, value] of Object.entries(signed)) form.append(key, value);
  form.append("api_key", API_KEY);
  form.append("signature", signParams(signed));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form },
  );

  const payload = (await res.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null;

  if (!res.ok || !payload?.secure_url) {
    const message = payload?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Cloudinary upload error: ${message}`);
  }

  return payload.secure_url;
}
