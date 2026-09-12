// Cover image upload to the Supabase `covers` bucket.
// Path scheme: {user_id}/{uuid}.{ext}
// Bucket should be public-read; writes are RLS-protected to the
// owner's own folder.

import { createClient } from "@/lib/supabase/client";

export const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadError =
  | { kind: "not_authenticated" }
  | { kind: "too_large"; sizeBytes: number }
  | { kind: "bad_type"; type: string }
  | { kind: "storage"; message: string };

export async function uploadCover(
  file: File,
): Promise<{ url: string } | UploadError> {
  if (!file.type.startsWith("image/")) {
    return { kind: "bad_type", type: file.type };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { kind: "too_large", sizeBytes: file.size };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "not_authenticated" };

  // Derive a clean extension. Default to "jpg".
  const dotIndex = file.name.lastIndexOf(".");
  const rawExt =
    dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : "";
  const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "jpg";

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.${ext}`;

  const { error } = await supabase.storage
    .from("covers")
    .upload(path, file, {
      cacheControl: "31536000", // 1 year — cover files are immutable
      upsert: false,
      contentType: file.type,
    });
  if (error) return { kind: "storage", message: error.message };

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return { url: data.publicUrl };
}

export function describeUploadError(e: UploadError): string {
  switch (e.kind) {
    case "not_authenticated":
      return "로그인이 필요해요.";
    case "too_large":
      return `파일이 너무 커요 (${(e.sizeBytes / 1024 / 1024).toFixed(1)} MB · 최대 5 MB).`;
    case "bad_type":
      return `이미지 파일만 올릴 수 있어요 (${e.type || "unknown"}).`;
    case "storage":
      return `업로드 실패: ${e.message}`;
  }
}
