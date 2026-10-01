import { Request, Response, NextFunction } from 'express';
import { auditRepository } from '../repositories/index.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const auditController = {
  async getClaimAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');
      const logs = await auditRepository.findByEntity('claims', claimId);
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  },

  async getAllAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const logs = await auditRepository.findAll();
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  },
};
