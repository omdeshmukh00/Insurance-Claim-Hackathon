import { config } from '../config/env.js';
import { isSupabaseConfigured, getSupabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { StorageError, ValidationError } from '../utils/errors.js';

// Local storage buffer cache for offline/test environments
const memoryStorage = new Map<string, { buffer: Buffer; mimeType: string }>();

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Validates file buffer magic bytes to ensure MIME type is genuine, not spoofed
 */
export function validateFileMagicBytes(buffer: Buffer, declaredMime: string): void {
  if (buffer.length < 4) {
    throw new ValidationError('Uploaded file is corrupted or empty');
  }

  // PDF magic header: %PDF (0x25 0x50 0x44 0x46)
  if (declaredMime === 'application/pdf') {
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (!isPdf) throw new ValidationError('Invalid PDF file content');
    return;
  }

  // PNG magic header: 0x89 0x50 0x4E 0x47
  if (declaredMime === 'image/png') {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    if (!isPng) throw new ValidationError('Invalid PNG file content');
    return;
  }

  // JPEG/JPG magic header: 0xFF 0xD8 0xFF
  if (declaredMime === 'image/jpeg' || declaredMime === 'image/jpg') {
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (!isJpg) throw new ValidationError('Invalid JPEG file content');
    return;
  }

  throw new ValidationError(`Unsupported file MIME type: ${declaredMime}`);
}

export const storageService = {
  async uploadFile(
    claimId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    validateFileMagicBytes(buffer, mimeType);

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `claims/${claimId}/${Date.now()}_${safeFileName}`;

    if (isSupabaseConfigured()) {
      try {
        const bucket = config.SUPABASE_STORAGE_BUCKET;
        const supabase = getSupabaseAdmin();

        const { error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          logger.error('Supabase storage upload error', { error: error.message });
          throw new StorageError(`Failed to upload to Supabase storage: ${error.message}`);
        }

        return storagePath;
      } catch (err: any) {
        if (err instanceof StorageError) throw err;
        throw new StorageError(`Storage upload failure: ${err.message}`);
      }
    }

    // Local / in-memory fallback
    memoryStorage.set(storagePath, { buffer, mimeType });
    logger.info(`Stored file in local cache: ${storagePath} (${buffer.length} bytes)`);
    return storagePath;
  },

  async downloadFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (isSupabaseConfigured()) {
      try {
        const bucket = config.SUPABASE_STORAGE_BUCKET;
        const { data, error } = await getSupabaseAdmin().storage.from(bucket).download(storagePath);
        if (error || !data) {
          throw new StorageError(`Failed to download file from storage: ${error?.message}`);
        }
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { buffer, mimeType: data.type || 'application/octet-stream' };
      } catch (err: any) {
        if (err instanceof StorageError) throw err;
        throw new StorageError(`Storage download failure: ${err.message}`);
      }
    }

    const item = memoryStorage.get(storagePath);
    if (!item) {
      throw new StorageError(`File not found in storage: ${storagePath}`);
    }
    return item;
  },
};
