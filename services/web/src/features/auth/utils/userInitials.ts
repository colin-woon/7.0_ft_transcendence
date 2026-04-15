const WORD_SPLIT = /\s+/;

/**
 * Returns up to two uppercase initials from a name-like input.
 */
export function getUserInitials(fullName?: string | null): string {
  const value = (fullName ?? "").trim();
  if (!value) return "??";

  const initials = value
    .split(WORD_SPLIT)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "??";
}
