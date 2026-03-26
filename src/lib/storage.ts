import { createClient } from "@supabase/supabase-js";
import { getSupabase, getStorageUrl } from "./supabase";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Server Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, serviceKey);
}

export async function uploadStyleImage(
  imageData: Uint8Array,
  mimeType: string,
  collection: string,
  styleId: string,
  index: number
): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const path = `${collection}/${styleId}/${styleId}-${index}.${ext}`;

  const { error } = await getServerSupabase()
    .storage.from("style-images")
    .upload(path, imageData, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/style-images/${path}`;
}

export async function uploadTempImage(
  imageData: Uint8Array,
  mimeType: string,
  sessionId: string,
  filename: string
): Promise<string> {
  const path = `temp/${sessionId}/${filename}`;

  const { error } = await getServerSupabase()
    .storage.from("style-images")
    .upload(path, imageData, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Temp image upload failed: ${error.message}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/style-images/${path}`;
}

/** Browser에서 Blob을 Supabase Storage에 직접 업로드 */
export async function uploadImageFromBrowser(
  blob: Blob,
  sessionId: string,
  filename: string
): Promise<string> {
  const path = `temp/${sessionId}/${filename}`;

  const { error } = await getSupabase()
    .storage.from("style-images")
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) throw new Error(`Browser image upload failed: ${error.message}`);

  return getStorageUrl("style-images", path);
}

export async function moveTempToFinal(
  sessionId: string,
  collection: string,
  styleId: string,
  tempFilename: string,
  index: number
): Promise<string> {
  const ext = tempFilename.split(".").pop() ?? "png";
  const fromPath = `temp/${sessionId}/${tempFilename}`;
  const toPath = `${collection}/${styleId}/${styleId}-${index}.${ext}`;

  const supabase = getServerSupabase();

  const { error } = await supabase
    .storage.from("style-images")
    .move(fromPath, toPath);

  if (error) throw new Error(`Image move failed: ${error.message}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/style-images/${toPath}`;
}

export async function deleteTempFolder(sessionId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .storage.from("style-images")
    .list(`temp/${sessionId}`);

  if (data && data.length > 0) {
    const paths = data.map((f) => `temp/${sessionId}/${f.name}`);
    await supabase.storage.from("style-images").remove(paths);
  }
}
