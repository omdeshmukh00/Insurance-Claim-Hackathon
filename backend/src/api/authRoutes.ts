import { Router } from 'express';
import { authController } from './authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile', requireAuth, authController.getProfile);
router.post('/profile', requireAuth, authController.updateProfile);
router.post('/switch-role', requireAuth, authController.switchRole);

export default router;
