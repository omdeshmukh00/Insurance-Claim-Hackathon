import { Router } from 'express';
import { assistantController } from './assistantController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, assistantController.handleQuery);

export default router;
