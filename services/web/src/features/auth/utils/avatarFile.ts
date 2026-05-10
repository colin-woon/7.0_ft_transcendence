export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read avatar file"));
    };
    reader.onerror = () => reject(new Error("Unable to read avatar file"));
    reader.readAsDataURL(file);
  });
}

export const AVATAR_MAX_BYTES = 1024 * 1024;

export function validateAvatarFile(fileOrData: File | string): string | null {
  // If a data URL string is provided, validate its prefix and approximate decoded size.
  if (typeof fileOrData === "string") {
    const trimmed = fileOrData.trim();
    if (!trimmed.toLowerCase().startsWith("data:image/")) {
      return "Only image files are allowed.";
    }

    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) {
      return "Avatar must be a base64-encoded image.";
    }
    const base64 = trimmed.substring(commaIndex + 1);

    // approximate decoded size from base64 length
    const approxDecoded = Math.floor(base64.length * 3 / 4);
    if (approxDecoded <= 0) return "Avatar file is empty.";
    if (approxDecoded > AVATAR_MAX_BYTES) {
      return "Avatar must be 1MB or smaller.";
    }
    return null;
  }

  // Otherwise, a File object: check MIME type and raw size as a quick client-side filter.
  const file = fileOrData as File;
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "Avatar must be 1MB or smaller.";
  }

  return null;
}
