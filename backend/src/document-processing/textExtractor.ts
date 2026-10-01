import { PDFParse } from 'pdf-parse';
import { logger } from '../utils/logger.js';

export interface ExtractedDocumentContent {
  text: string;
  pageCount: number;
  metadata?: Record<string, any>;
}

export async function extractTextFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedDocumentContent> {
  // If plain text or markdown
  if (mimeType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
    return {
      text: fileBuffer.toString('utf-8'),
      pageCount: 1,
    };
  }

  // If PDF
  if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    try {
      const parser = new PDFParse({ data: fileBuffer });
      await parser.load();
      const textResult = await parser.getText();
      const fullText = typeof textResult === 'string' ? textResult : (textResult as any)?.text || String(textResult || '');
      
      if (fullText && fullText.trim().length > 10) {
        logger.info(`Extracted ${fullText.length} characters from PDF: ${fileName}`);
        return {
          text: fullText,
          pageCount: 1,
        };
      }
    } catch (err: any) {
      logger.warn(`pdf-parse extraction failed on ${fileName}: ${err.message}. Trying buffer string scan.`);
    }

    // Fallback: extract readable ASCII/UTF-8 streams from PDF buffer
    try {
      const raw = fileBuffer.toString('latin1');
      const matches = raw.match(/BT[\s\S]*?ET/g) || [];
      const cleaned = matches
        .map((m) => m.replace(/[\\(\\)\[\]]/g, ' '))
        .join(' ')
        .replace(/\s+/g, ' ');

      if (cleaned.length > 50) {
        return { text: cleaned, pageCount: 1 };
      }
    } catch {
      // ignore
    }
  }

  // Fallback string conversion
  return {
    text: fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' '),
    pageCount: 1,
  };
}
