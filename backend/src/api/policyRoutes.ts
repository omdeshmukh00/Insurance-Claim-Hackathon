import { Router } from 'express';
import { policyController } from './policyController.js';
import { documentUploadMiddleware } from './documentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/upload', requireAuth, documentUploadMiddleware, policyController.uploadPolicy);
router.post('/', requireAuth, policyController.createPolicy);
router.get('/', requireAuth, policyController.listPolicies);
router.get('/:id', requireAuth, policyController.getPolicy);
router.patch('/:id', requireAuth, policyController.updatePolicy);

export default router;
