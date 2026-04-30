import heic2any from "heic2any";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const ACCEPTED_IMAGE_EXTENSIONS =
  "image/png,image/jpeg,image/gif,image/webp,image/heic,image/heif,.heic,.heif";

function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function normalizeImageToPng(file: File): Promise<Blob> {
  if (isHeicFile(file)) {
    const result = await heic2any({
      blob: file,
      toType: "image/png",
      quality: 1,
    });
    return Array.isArray(result) ? result[0] : result;
  }

  if (file.type === "image/png") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to convert image to PNG"));
        },
        "image/png",
        1
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export function isValidImageType(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (ALLOWED_IMAGE_TYPES.includes(type)) {
    return true;
  }

  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    return true;
  }

  return false;
}
