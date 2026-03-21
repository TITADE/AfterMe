/**
 * PDF generation service for Family Kit printable documents.
 * Produces a multi-page PDF with instructions, QR code, Key Card, and storage tips.
 */
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';

interface KitPdfOptions {
  accessKey: string;
  ownerName: string | null;
  documentCount: number;
  kitVersion: number;
  qrDataUri: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(opts: KitPdfOptions): string {
  const owner = opts.ownerName ? escapeHtml(opts.ownerName) : 'Your Loved One';
  const date = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 48px; size: A4; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3142; line-height: 1.5; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 20px; font-weight: 600; color: #C9963A; margin-top: 32px; }
    h3 { font-size: 16px; font-weight: 600; margin-top: 20px; }
    .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
    .card { border: 2px solid #C9963A; border-radius: 12px; padding: 24px; margin: 24px 0; page-break-inside: avoid; }
    .qr-container { text-align: center; margin: 20px 0; }
    .qr-container img { width: 200px; height: 200px; }
    .qr-caption { font-size: 11px; color: #888; margin-top: 8px; text-align: center; }
    .warning { background: #FFF3CD; border: 1px solid #FFEAA7; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .warning-icon { font-size: 18px; margin-right: 8px; }
    .steps { counter-reset: step; padding: 0; }
    .steps li { counter-increment: step; list-style: none; padding: 8px 0 8px 40px; position: relative; }
    .steps li::before { content: counter(step); position: absolute; left: 0; width: 28px; height: 28px; border-radius: 14px; background: #C9963A; color: white; text-align: center; line-height: 28px; font-weight: 600; font-size: 13px; }
    .storage-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
    .storage-item { flex: 1; min-width: 200px; border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    .storage-icon { font-size: 24px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
    .page-break { page-break-before: always; }
    .key-card { border: 3px solid #2D3142; border-radius: 16px; padding: 32px; text-align: center; page-break-inside: avoid; }
    .key-card-title { font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #C9963A; margin-bottom: 16px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 12px; }
    .checklist li { padding: 4px 0; }
    .checklist li::before { content: '☐ '; }
  </style>
</head>
<body>

  <!-- PAGE 1: Cover & Instructions -->
  <h1>After Me — Family Kit</h1>
  <p class="subtitle">Prepared for the loved ones of <strong>${owner}</strong> &middot; ${date}</p>

  <div class="card">
    <p style="font-size: 15px; margin: 0;">
      This kit contains everything needed to access <strong>${owner}'s</strong> secure document vault.
      It includes <strong>${opts.documentCount} documents</strong> protected with military-grade encryption.
    </p>
  </div>

  <h2>How to Access the Vault</h2>
  <ol class="steps">
    <li><strong>Download the After Me app</strong> from the App Store or Google Play.</li>
    <li>Choose <strong>"I Have a Legacy Kit"</strong> on the welcome screen.</li>
    <li><strong>Scan the QR code</strong> on the next page of this document using your phone's camera.</li>
    <li>When prompted, <strong>select the .afterme file</strong> — it may be on a USB drive, in cloud storage, or emailed to you alongside this kit.</li>
    <li>The app will decrypt and import all documents into a local vault on your device.</li>
  </ol>

  <div class="warning">
    <span class="warning-icon">⚠️</span>
    <strong>No app needed?</strong> The .afterme format is an open standard. You can also use the free decoder at
    <strong>afterme.app/decoder</strong> or any tool that supports the specification.
  </div>

  <h2>What You'll Find Inside</h2>
  <p>The vault may contain identity documents, legal papers, financial records, insurance policies,
  medical information, digital account details, and personal messages. The exact contents depend on
  what ${owner} chose to include.</p>

  <!-- PAGE 2: QR Code Key Card -->
  <div class="page-break"></div>

  <div class="key-card">
    <div class="key-card-title">Access Key — Keep Secure</div>
    <div class="qr-container">
      <img src="${opts.qrDataUri}" alt="Family Kit Access Key QR Code" />
    </div>
    <p class="qr-caption">
      Scan this QR code with the After Me app to unlock the vault.<br/>
      This code is the <strong>only key</strong> — without it, the vault cannot be opened.
    </p>
    <div class="meta-row">
      <span>Kit Version: ${opts.kitVersion}</span>
      <span>Created: ${date}</span>
      <span>Documents: ${opts.documentCount}</span>
    </div>
  </div>

  <div class="warning" style="margin-top: 24px;">
    <span class="warning-icon">🔐</span>
    <strong>Security Note:</strong> Store this QR code <strong>separately</strong> from the .afterme file.
    Anyone with both the QR code and the file can access all documents in the vault.
  </div>

  <!-- PAGE 3: Storage Recommendations & Checklist -->
  <div class="page-break"></div>

  <h2>Storage Recommendations</h2>
  <p>For maximum protection, store copies in multiple secure locations:</p>

  <div class="storage-grid">
    <div class="storage-item">
      <div class="storage-icon">🏦</div>
      <h3 style="margin-top: 4px;">Safety Deposit Box</h3>
      <p style="font-size: 13px;">Fireproof and secure. Ideal for the QR code printout.</p>
    </div>
    <div class="storage-item">
      <div class="storage-icon">⚖️</div>
      <h3 style="margin-top: 4px;">Solicitor / Attorney</h3>
      <p style="font-size: 13px;">Include with your will or estate plan documents.</p>
    </div>
    <div class="storage-item">
      <div class="storage-icon">🔥</div>
      <h3 style="margin-top: 4px;">Fireproof Home Safe</h3>
      <p style="font-size: 13px;">Readily accessible to trusted family members.</p>
    </div>
    <div class="storage-item">
      <div class="storage-icon">💾</div>
      <h3 style="margin-top: 4px;">USB Drive (encrypted)</h3>
      <p style="font-size: 13px;">Store the .afterme file on an encrypted USB alongside this printout.</p>
    </div>
  </div>

  <h2>Distribution Checklist</h2>
  <ul class="checklist" style="list-style: none; padding: 0;">
    <li>Printed this document and the QR code</li>
    <li>Stored the .afterme file on a USB drive or cloud storage</li>
    <li>Placed QR code printout in a separate secure location from the file</li>
    <li>Informed trusted family member(s) about the kit's existence</li>
    <li>Noted storage locations in estate planning documents</li>
    <li>Scheduled a reminder to update the kit every 6 months</li>
  </ul>

  <div class="footer">
    After Me — Family Kit v${opts.kitVersion} &middot; ${date} &middot; afterme.app<br/>
    This document is confidential. Handle with care.
  </div>

</body>
</html>`;
}

export class PdfExportService {
  /**
   * Generate a printable PDF of the Family Kit and return its file path.
   */
  static async generateKitPdf(opts: KitPdfOptions): Promise<string> {
    const html = buildHtml(opts);
    const { uri } = await printToFileAsync({ html, base64: false });
    return uri;
  }

  /**
   * Generate and immediately open the system share sheet for the PDF.
   */
  static async shareKitPdf(opts: KitPdfOptions): Promise<void> {
    const pdfUri = await this.generateKitPdf(opts);
    await shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Family Kit PDF',
      UTI: 'com.adobe.pdf',
    });
  }
}
