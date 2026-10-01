import { Request, Response, NextFunction } from 'express';
import { settlementService } from '../claims/settlementService.js';
import { settleClaimSchema } from '../schemas/settlement.js';
import { claimService } from '../claims/claimService.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const settlementController = {
  async settleClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');
      const validatedInput = settleClaimSchema.parse(req.body);

      const settlement = await settlementService.settleClaim(
        req.user.id,
        req.user.role,
        claimId,
        validatedInput
      );
      sendSuccess(res, settlement, 200);
    } catch (err) {
      next(err);
    }
  },

  async getSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const settlement = await settlementService.getSettlement(claimId);
      sendSuccess(res, settlement);
    } catch (err) {
      next(err);
    }
  },

  async getRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const recommendation = await settlementService.getRecommendation(claimId);
      sendSuccess(res, recommendation);
    } catch (err) {
      next(err);
    }
  },
};
