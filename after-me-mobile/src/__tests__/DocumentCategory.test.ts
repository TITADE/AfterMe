import {
  DOCUMENT_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_TEMPLATES,
  TARGET_DOCS_PER_CATEGORY,
} from '../models/DocumentCategory';

describe('DocumentCategory', () => {
  const expectedCategories = [
    'identity', 'legal', 'property', 'finance',
    'insurance', 'medical', 'digital', 'personal',
  ];

  it('defines exactly 8 categories', () => {
    expect(DOCUMENT_CATEGORIES).toHaveLength(8);
  });

  it('contains all expected categories', () => {
    for (const cat of expectedCategories) {
      expect(DOCUMENT_CATEGORIES).toContain(cat);
    }
  });

  it('every category has a label', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(typeof CATEGORY_LABELS[cat]).toBe('string');
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });

  it('every category has a description', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(typeof CATEGORY_DESCRIPTIONS[cat]).toBe('string');
    }
  });

  it('every category has an icon', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(typeof CATEGORY_ICONS[cat]).toBe('string');
    }
  });

  it('every category has a color', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('every category has templates', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(Array.isArray(CATEGORY_TEMPLATES[cat])).toBe(true);
      expect(CATEGORY_TEMPLATES[cat].length).toBeGreaterThan(0);
    }
  });

  it('TARGET_DOCS_PER_CATEGORY is a positive integer', () => {
    expect(TARGET_DOCS_PER_CATEGORY).toBeGreaterThan(0);
    expect(Number.isInteger(TARGET_DOCS_PER_CATEGORY)).toBe(true);
  });
});
