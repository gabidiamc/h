/**
 * Utility for easy phone number editing and validation without intrusive auto-formatting.
 * Allows effortless editing, backspacing, deleting without numbers or prefixes reappearing automatically.
 */

/**
 * Sanitizes phone input allowing only valid phone characters (+, digits, spaces, hyphens).
 * Does NOT aggressively prepend +1 or wrap in parentheses while the user is actively typing or deleting.
 */
export function formatUSPhone(raw: string): string {
  if (!raw) return "";
  // If user clears the input, return empty immediately so no automatic prefix is added
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Allow user to write digits, spaces, dashes, parentheses and leading plus naturally
  // Only remove invalid characters (like letters or weird symbols)
  return raw.replace(/[^\d\s\-+()]/g, "");
}

/**
 * Soft format on blur: if the user typed 10 bare digits, format cleanly as (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX
 * Only applied if complete, never during active keystrokes
 */
export function formatPhoneOnBlur(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // If Mexican number (10 digits +52) or other international, keep cleanly formatted
  return raw.trim();
}

/**
 * Extracts pure digits and optional leading '+' for backend storage, SMS, or WhatsApp links (wa.me/...)
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return "";
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Formats a phone number for direct WhatsApp messaging links
 */
export function getWhatsAppPhone(raw: string, defaultCountryCode: string = "1"): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // If standard 10-digit number without country code, prepend default country code (e.g. 1 for US or 52 for Mexico)
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Validates if the phone has a reasonable number of digits (7 to 15 digits)
 */
export function isValidUSPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidPhone(phone: string): boolean {
  return isValidUSPhone(phone);
}
