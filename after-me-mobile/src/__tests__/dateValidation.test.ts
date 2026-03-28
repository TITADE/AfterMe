import {
  isValidIsoDateString,
  normaliseOptionalIsoDate,
} from '../utils/dateValidation';

describe('dateValidation', () => {
  describe('isValidIsoDateString', () => {
    it('accepts empty and null', () => {
      expect(isValidIsoDateString('')).toBe(true);
      expect(isValidIsoDateString(null)).toBe(true);
      expect(isValidIsoDateString(undefined)).toBe(true);
    });

    it('accepts valid YYYY-MM-DD', () => {
      expect(isValidIsoDateString('2026-03-28')).toBe(true);
      expect(isValidIsoDateString('2000-01-01')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidIsoDateString('03/28/2026')).toBe(false);
      expect(isValidIsoDateString('2026-3-28')).toBe(false);
      expect(isValidIsoDateString('not-a-date')).toBe(false);
      expect(isValidIsoDateString('2026-13-01')).toBe(false);
    });
  });

  describe('normaliseOptionalIsoDate', () => {
    it('returns null for empty and invalid', () => {
      expect(normaliseOptionalIsoDate('')).toBeNull();
      expect(normaliseOptionalIsoDate(null)).toBeNull();
      expect(normaliseOptionalIsoDate('bad')).toBeNull();
    });

    it('returns value for valid', () => {
      expect(normaliseOptionalIsoDate('2026-03-28')).toBe('2026-03-28');
    });
  });
});
