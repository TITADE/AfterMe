import {
  readAsStringAsync,
  getInfoAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import * as DocumentRepository from '../db/DocumentRepository';
import type { Document, DocumentInsert } from '../models/Document';
import type { DocumentCategory } from '../models/DocumentCategory';
import { MAX_SINGLE_DOCUMENT_SIZE_BYTES } from '../constants/storage';

export class DocumentService {
  /**
   * Import a document from a file path (e.g. from scanner or picker).
   * Validates size, encrypts, stores, and creates metadata.
   */
  static async importFromFilePath(
    filePath: string,
    category: DocumentCategory,
    title: string,
    options?: Partial<DocumentInsert>
  ): Promise<Document> {
    const info = await getInfoAsync(filePath);

    if (!info.exists || typeof (info as { size?: number }).size !== 'number') {
      throw new Error('File not found or not accessible');
    }

    const size = (info as { size?: number }).size ?? 0;
    if (size > MAX_SINGLE_DOCUMENT_SIZE_BYTES) {
      throw new Error(
        `File too large. Maximum size is ${MAX_SINGLE_DOCUMENT_SIZE_BYTES / 1024 / 1024}MB`
      );
    }

    const base64 = await readAsStringAsync(filePath, {
      encoding: EncodingType.Base64,
    });
    const content = Buffer.from(base64, 'base64');

    const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
    const format = ext === '.pdf' ? 'pdf' : ext === '.png' ? 'png' : 'jpeg';
    const fileRef = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.enc`;

    await EncryptedStorageService.initializeVault();
    await EncryptedStorageService.saveFile(fileRef.replace('.enc', ''), content);

    const doc: DocumentInsert = {
      category,
      title,
      fileRef: fileRef.replace('.enc', ''),
      format,
      ...options,
    };

    return DocumentRepository.insertDocument(doc);
  }

  /**
   * Import from base64 (e.g. from document scanner with Base64 response).
   */
  static async importFromBase64(
    base64: string,
    category: DocumentCategory,
    title: string,
    format: 'jpeg' | 'png' = 'jpeg'
  ): Promise<Document> {
    const content = Buffer.from(base64, 'base64');

    if (content.length > MAX_SINGLE_DOCUMENT_SIZE_BYTES) {
      throw new Error(
        `File too large. Maximum size is ${MAX_SINGLE_DOCUMENT_SIZE_BYTES / 1024 / 1024}MB`
      );
    }

    const fileRef = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await EncryptedStorageService.initializeVault();
    await EncryptedStorageService.saveFile(fileRef, content);

    return DocumentRepository.insertDocument({
      category,
      title,
      fileRef,
      format,
    });
  }

  /**
   * Get decrypted document content for viewing.
   */
  static async getDocumentContent(doc: Document): Promise<Buffer> {
    return EncryptedStorageService.readFile(doc.fileRef);
  }

  static async getAllDocuments(): Promise<Document[]> {
    return DocumentRepository.getAllDocuments();
  }

  static async getDocumentsByCategory(category: string): Promise<Document[]> {
    return DocumentRepository.getDocumentsByCategory(category);
  }

  static async getDocumentById(id: string): Promise<Document | null> {
    return DocumentRepository.getDocumentById(id);
  }

  static async updateDocument(
    id: string,
    updates: Parameters<typeof DocumentRepository.updateDocument>[1]
  ): Promise<void> {
    return DocumentRepository.updateDocument(id, updates);
  }

  /**
   * Delete document and its encrypted file.
   */
  static async deleteDocument(id: string): Promise<void> {
    const doc = await DocumentRepository.getDocumentById(id);
    if (doc) {
      await EncryptedStorageService.deleteFile(doc.fileRef);
      if (doc.thumbnailRef) {
        await EncryptedStorageService.deleteFile(doc.thumbnailRef).catch(() => {});
      }
    }
    await DocumentRepository.deleteDocument(id);
  }

  static async getDocumentCountByCategory(): Promise<Record<string, number>> {
    return DocumentRepository.getDocumentCountByCategory();
  }
}
