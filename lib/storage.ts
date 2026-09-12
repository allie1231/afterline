export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export type UploadError =
  | { kind: "not_authenticated" }
  | { kind: "too_large"; sizeBytes: number }
  | { kind: "bad_type"; type: string }
  | { kind: "storage"; message: string };

export async function uploadCover(
  _file: File,
): Promise<{ url: string } | UploadError> {
  return { kind: "storage", message: "Upload is not available (Notion read-only mode)" };
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
