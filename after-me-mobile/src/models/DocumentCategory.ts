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

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  identity: '🪪',
  legal: '⚖️',
  property: '🏠',
  finance: '💰',
  insurance: '🛡️',
  medical: '🏥',
  digital: '💻',
  personal: '💌',
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  identity: '#5B8DEF',
  legal: '#8B5CF6',
  property: '#10B981',
  finance: '#F59E0B',
  insurance: '#3B82F6',
  medical: '#EF4444',
  digital: '#6366F1',
  personal: '#EC4899',
};

/**
 * Suggested document templates per category.
 * These drive the guided addition flow and completeness scoring.
 */
export const CATEGORY_TEMPLATES: Record<DocumentCategory, string[]> = {
  identity: ['Passport', 'Driver\'s Licence', 'Birth Certificate', 'National ID', 'Citizenship Certificate'],
  legal: ['Will / Testament', 'Power of Attorney', 'Living Will / Advance Directive', 'Trust Documents'],
  property: ['Property Deed', 'Mortgage Agreement', 'Lease Agreement', 'Home Insurance Policy', 'Vehicle Title'],
  finance: ['Bank Statements', 'Investment Portfolio', 'Pension / Superannuation', 'Tax Returns', 'Loan Agreements'],
  insurance: ['Life Insurance Policy', 'Health Insurance Card', 'Property Insurance', 'Vehicle Insurance', 'Income Protection'],
  medical: ['GP Health Summary', 'Prescription List', 'Specialist Reports', 'Vaccination Records', 'Medical Directives'],
  digital: ['Password Manager Export', 'Email Account Details', 'Social Media Accounts', 'Crypto Wallet Keys', 'Subscription List'],
  personal: ['Final Wishes Letter', 'Funeral Preferences', 'Family Photos', 'Personal Messages', 'Ethical Will'],
};

export const TARGET_DOCS_PER_CATEGORY = 3;
