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

export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "Avatar must be 1MB or smaller.";
  }

  return null;
}
