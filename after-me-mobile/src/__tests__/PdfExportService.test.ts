jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: '/mock/kit.pdf' })),
}));
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
}));

import { PdfExportService } from '../services/PdfExportService';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';

const defaultOpts = {
  accessKey: 'test-access-key-123',
  ownerName: 'Jane Doe',
  documentCount: 5,
  kitVersion: 2,
  qrDataUri: 'data:image/png;base64,AAAA',
};

describe('PdfExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKitPdf', () => {
    it('returns PDF file URI', async () => {
      const uri = await PdfExportService.generateKitPdf(defaultOpts);
      expect(uri).toBe('/mock/kit.pdf');
    });

    it('passes HTML to printToFileAsync', async () => {
      await PdfExportService.generateKitPdf(defaultOpts);
      expect(printToFileAsync).toHaveBeenCalledTimes(1);
      const arg = (printToFileAsync as jest.Mock).mock.calls[0][0];
      expect(arg).toHaveProperty('html');
      expect(arg).toHaveProperty('base64', false);
      expect(typeof arg.html).toBe('string');
    });

    it('HTML contains owner name, document count, QR data URI, and kit version', async () => {
      await PdfExportService.generateKitPdf(defaultOpts);
      const html: string = (printToFileAsync as jest.Mock).mock.calls[0][0].html;
      expect(html).toContain('Jane Doe');
      expect(html).toContain('5 documents');
      expect(html).toContain('data:image/png;base64,AAAA');
      expect(html).toContain('Kit Version: 2');
    });

    it('escapes special characters in owner name', async () => {
      await PdfExportService.generateKitPdf({
        ...defaultOpts,
        ownerName: '<script>alert("xss")</script>',
      });
      const html: string = (printToFileAsync as jest.Mock).mock.calls[0][0].html;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&quot;xss&quot;');
    });
  });

  describe('shareKitPdf', () => {
    it('generates PDF and calls shareAsync with correct mimeType', async () => {
      await PdfExportService.shareKitPdf(defaultOpts);
      expect(printToFileAsync).toHaveBeenCalledTimes(1);
      expect(shareAsync).toHaveBeenCalledWith(
        '/mock/kit.pdf',
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
    });
  });
});
