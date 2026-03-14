/**
 * Returns 1–2 character initials from a name and/or email for avatars.
 * Prefers full name: "First Last" → "FL", single name → first 2 chars, else email prefix or "?".
 */
export function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export default getInitials;
