import { Router } from 'express';
import { adminController } from './adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Enforce authentication & ADMIN role for all /api/admin routes
router.use(requireAuth, requireRole('ADMIN'));

// Operational Dashboard
router.get('/dashboard', adminController.getDashboard);

// Policy Catalog & Pricing Management
router.get('/policies', adminController.listPolicies);
router.post('/policies', adminController.createPolicy);
router.patch('/policies/:id', adminController.updatePolicy);
router.patch('/policies/:id/pricing', adminController.updatePricing);

// Claims Inspection & Decisioning
router.get('/claims', adminController.listClaims);
router.get('/claims/:id', adminController.getClaimDetail);
router.post('/claims/:id/review', adminController.submitReview);
router.post('/claims/:id/settle', adminController.settleClaim);

export default router;
