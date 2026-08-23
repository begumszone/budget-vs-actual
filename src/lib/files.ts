import "server-only";
import { prisma } from "@/lib/db";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

export type FileValidationError = { error: string };

/**
 * FormData'dan gelen bir dosyayı doğrular ve FileAsset olarak kaydeder.
 * Dosya boşsa null döner (opsiyonel alanlar için).
 */
export async function saveUploadedFile(
  file: FormDataEntryValue | null,
  uploadedById: string,
  { required = false }: { required?: boolean } = {},
): Promise<{ id: string } | null | FileValidationError> {
  if (!file || typeof file === "string" || file.size === 0) {
    if (required) return { error: "Dosya yüklenmesi zorunludur." };
    return null;
  }

  if (file.size > MAX_BYTES) {
    return { error: "Dosya boyutu 10 MB'ı aşamaz." };
  }

  if (!ALLOWED.has(file.type)) {
    return {
      error: "Yalnızca PDF veya görsel (JPG, PNG, WEBP) yükleyebilirsiniz.",
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const asset = await prisma.fileAsset.create({
    data: {
      filename: file.name || "dosya",
      mimeType: file.type,
      size: file.size,
      data: bytes,
      uploadedById,
    },
    select: { id: true },
  });

  return asset;
}

export function isFileError(
  value: unknown,
): value is FileValidationError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value
  );
}
