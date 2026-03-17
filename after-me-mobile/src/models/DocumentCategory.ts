/**
 * The 8 predefined document categories per PRD.
 * Drives engagement with progress rings and completeness scoring.
 */
export type DocumentCategory =
  | 'identity'
  | 'legal'
  | 'property'
  | 'finance'
  | 'insurance'
  | 'medical'
  | 'digital'
  | 'personal';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'identity',
  'legal',
  'property',
  'finance',
  'insurance',
  'medical',
  'digital',
  'personal',
];

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identity: 'Identity',
  legal: 'Legal',
  property: 'Property',
  finance: 'Finance',
  insurance: 'Insurance',
  medical: 'Medical',
  digital: 'Digital',
  personal: 'Personal',
};

export const CATEGORY_DESCRIPTIONS: Record<DocumentCategory, string> = {
  identity: 'Passport, ID, birth certificate, citizenship',
  legal: 'Wills, powers of attorney, deeds',
  property: 'Deeds, mortgage docs, ownership records',
  finance: 'Bank statements, investments, pensions',
  insurance: 'Life, health, property insurance policies',
  medical: 'Health records, prescriptions, directives',
  digital: 'Passwords, accounts, digital assets',
  personal: 'Letters, photos, final wishes',
};
