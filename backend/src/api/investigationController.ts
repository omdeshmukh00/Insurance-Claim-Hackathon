import { Request, Response, NextFunction } from 'express';
import { claimInvestigationService } from '../orchestration/claimInvestigationService.js';
import { claimService } from '../claims/claimService.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const investigationController = {
  async triggerInvestigation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      // Verify authorization on claim
      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const result = await claimInvestigationService.runInvestigation(claimId, req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getInvestigation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const summary = await claimInvestigationService.getInvestigationSummary(claimId);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },
};
