import type { DocumentCategory } from './DocumentCategory';

export interface Document {
  id: string;
  category: DocumentCategory;
  title: string;
  /** Issue date of the document */
  documentDate: string | null;
  /** Expiry date for "Keep It Current" alerts */
  expiryDate: string | null;
  /** Provider/issuer name */
  providerName: string | null;
  /** Physical location of original */
  locationOfOriginal: string | null;
  /** Encrypted blob filename (without path) */
  fileRef: string;
  /** Optional thumbnail ref for grid display */
  thumbnailRef: string | null;
  /** File format: jpeg, png, pdf */
  format: 'jpeg' | 'png' | 'pdf';
  /** System-added date */
  createdAt: string;
  /** Last modified */
  updatedAt: string;
}

export interface DocumentInsert {
  category: DocumentCategory;
  title: string;
  documentDate?: string | null;
  expiryDate?: string | null;
  providerName?: string | null;
  locationOfOriginal?: string | null;
  fileRef: string;
  thumbnailRef?: string | null;
  format: 'jpeg' | 'png' | 'pdf';
}
