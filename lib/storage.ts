import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET = "images";

function getClient() {
  return createClient(supabaseUrl, serviceKey);
}

export async function uploadToSupabase(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const supabase = getClient();

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return publicData.publicUrl;
}
