/**
 * Validates YYYY-MM-DD strings used for document / expiry dates.
 * Empty string is treated as valid (cleared / optional field).
 */
export function isValidIsoDateString(value: string | null | undefined): boolean {
  if (value == null || value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = Date.parse(`${value}T12:00:00`);
  return !Number.isNaN(t);
}

/** Normalise for save: invalid or empty becomes null. */
export function normaliseOptionalIsoDate(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return isValidIsoDateString(value) ? value : null;
}
