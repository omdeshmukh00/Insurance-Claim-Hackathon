import express, { Request, Response } from 'express';
import { config } from './config/env.js';
import { corsMiddleware } from './config/cors.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import claimRoutes from './api/claimRoutes.js';
import policyRoutes from './api/policyRoutes.js';
import assistantRoutes from './api/assistantRoutes.js';
import adminRoutes from './api/adminRoutes.js';
import authRoutes from './api/authRoutes.js';
import { auditController } from './api/auditController.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { NotFoundError } from './utils/errors.js';
import { logger } from './utils/logger.js';

export const app = express();

// Global middleware
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health & Status endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'insurance-claims-ai-backend',
    brand: 'InsuredYou',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'InsuredYou - AI Insurance Claims Intelligence Backend API',
    version: '1.0.0',
    modules: [
      'claims-assessment',
      'ai-agents',
      'agent-orchestration',
      'rag-engine',
      'policy-document-agent',
      'policy-rag-agent',
      'claim-document-agent',
      'coverage-agent',
      'anomaly-agent',
      'missing-information-agent',
      'claim-assessment-agent',
      'settlement-recommendation-agent',
      'user-assistant-agent',
      'human-review',
      'evidence-graph',
      'settlement-engine',
      'smtp-notifications',
    ],
  });
});

// Mounted API Routes
app.use(`${config.API_PREFIX}/auth`, authRoutes);
app.use(`${config.API_PREFIX}/policies`, policyRoutes);
app.use(`${config.API_PREFIX}/claims`, claimRoutes);
app.use(`${config.API_PREFIX}/assistant`, assistantRoutes);
app.use(`${config.API_PREFIX}/admin`, adminRoutes);

// Admin-only global audit logs
app.get(
  `${config.API_PREFIX}/audit-logs`,
  requireAuth,
  requireRole('ADMIN'),
  auditController.getAllAuditLogs
);

// 404 handler
app.use((req: Request, _res: Response, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
});

// Centralized error handler
app.use(errorHandler);

// Start server when run directly (not during vitest test imports)
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    logger.info(`Backend server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
  });
}
