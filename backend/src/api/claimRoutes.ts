import { Router } from 'express';
import { claimController } from './claimController.js';
import { documentController, documentUploadMiddleware } from './documentController.js';
import { investigationController } from './investigationController.js';
import { reviewController } from './reviewController.js';
import { settlementController } from './settlementController.js';
import { auditController } from './auditController.js';
import { requireAuth, requireAnyRole } from '../middleware/auth.js';

const router = Router();

// ============================================================
// CLAIMS CRUD & TIMELINE
// ============================================================
router.post('/', requireAuth, claimController.createClaim);
router.get('/', requireAuth, claimController.listClaims);
router.get('/:id', requireAuth, claimController.getClaimById);
router.patch('/:id', requireAuth, claimController.updateClaim);
router.get('/:id/events', requireAuth, claimController.getClaimEvents);
router.get('/:id/evidence', requireAuth, claimController.getClaimEvidence);
router.get('/:id/assessment', requireAuth, claimController.getClaimAssessment);

// ============================================================
// DOCUMENTS
// ============================================================
router.post('/:id/documents', requireAuth, documentUploadMiddleware, documentController.uploadDocument);
router.get('/:id/documents', requireAuth, documentController.listDocuments);
router.get('/:id/documents/:docId/download', requireAuth, documentController.downloadDocument);

// ============================================================
// AI AGENT INVESTIGATION
// ============================================================
router.post('/:id/investigate', requireAuth, investigationController.triggerInvestigation);
router.get('/:id/investigation', requireAuth, investigationController.getInvestigation);

// ============================================================
// HUMAN REVIEW & INFORMATION REQUESTS
// ============================================================
router.post(
  '/:id/review',
  requireAuth,
  requireAnyRole('CLAIMS_OFFICER', 'INVESTIGATOR', 'ADMIN'),
  reviewController.submitReview
);
router.post(
  '/:id/request-information',
  requireAuth,
  requireAnyRole('CLAIMS_OFFICER', 'INVESTIGATOR', 'ADMIN'),
  reviewController.requestInformation
);
router.get('/:id/reviews', requireAuth, reviewController.listReviews);
router.get('/:id/missing-information', requireAuth, reviewController.listMissingInformation);

// ============================================================
// SETTLEMENT
// ============================================================
router.post(
  '/:id/settle',
  requireAuth,
  requireAnyRole('CLAIMS_OFFICER', 'ADMIN'),
  settlementController.settleClaim
);
router.get('/:id/settlement', requireAuth, settlementController.getSettlement);
router.get('/:id/settlement/recommendation', requireAuth, settlementController.getRecommendation);

// ============================================================
// AUDIT LOGS
// ============================================================
router.get(
  '/:id/audit-logs',
  requireAuth,
  requireAnyRole('CLAIMS_OFFICER', 'INVESTIGATOR', 'ADMIN'),
  auditController.getClaimAuditLogs
);

export default router;
