export function normalizePhone(phone) {
  let formatted = phone.trim().replace(/\s+/g, "");

  if (formatted.startsWith("+")) {
    formatted = formatted.substring(1);
  }

  if (formatted.startsWith("91") && formatted.length === 12) {
    formatted = formatted.substring(2);
  }

  return formatted;
}