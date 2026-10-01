import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storageService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../document-processing/storageService.js';
import { documentRepository, eventRepository, auditRepository } from '../repositories/index.js';
import { claimService } from '../claims/claimService.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

// Memory storage for file buffering before validation & upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG`));
    }
  },
});

export const documentUploadMiddleware = upload.single('file');

export const documentController = {
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      // Verify claim exists and caller has authorization
      const claim = await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const file = req.file;
      if (!file) {
        throw new ValidationError('No file uploaded. Please supply a file with key "file"');
      }

      const documentType = (req.body.document_type || 'GENERAL').toUpperCase();

      // Upload file to Supabase or local storage
      const storagePath = await storageService.uploadFile(
        claimId,
        file.originalname,
        file.buffer,
        file.mimetype
      );

      // Create claim document metadata record
      const doc = await documentRepository.create({
        claim_id: claimId,
        file_name: file.originalname,
        storage_path: storagePath,
        mime_type: file.mimetype,
        file_size: file.size,
        document_type: documentType,
        uploaded_by: req.user.id,
        processing_status: 'UPLOADED',
      });

      // Save claim event
      await eventRepository.create({
        claim_id: claimId,
        type: 'document_uploaded',
        actor_type: 'USER',
        actor: req.user.id,
        status: 'COMPLETED',
        message: `Document "${file.originalname}" (${documentType}) uploaded`,
        metadata: { document_id: doc.id, file_name: file.originalname, document_type: documentType },
      });

      // Save audit log
      await auditRepository.create({
        actor_type: 'USER',
        actor_id: req.user.id,
        action: 'DOCUMENT_UPLOADED',
        entity_type: 'claim_documents',
        entity_id: doc.id,
        metadata: { claim_id: claimId, file_name: file.originalname, size: file.size },
      });

      sendSuccess(res, doc, 201);
    } catch (err) {
      next(err);
    }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      // Verify access to claim
      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const docs = await documentRepository.findByClaimId(claimId);
      sendSuccess(res, docs);
    } catch (err) {
      next(err);
    }
  },

  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');
      const docId = getParam(req, 'docId');

      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const doc = await documentRepository.findById(docId);
      if (!doc || doc.claim_id !== claimId) {
        throw new NotFoundError('Document not found for this claim');
      }

      const { buffer, mimeType } = await storageService.downloadFile(doc.storage_path);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },
};
