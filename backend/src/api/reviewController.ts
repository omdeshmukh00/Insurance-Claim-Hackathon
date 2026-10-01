import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../claims/reviewService.js';
import { reviewDecisionSchema, requestInformationSchema } from '../schemas/review.js';
import { reviewRepository, missingInfoRepository } from '../repositories/index.js';
import { claimService } from '../claims/claimService.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const reviewController = {
  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');
      const validatedInput = reviewDecisionSchema.parse(req.body);

      const decision = await reviewService.submitReview(req.user.id, claimId, validatedInput);
      sendSuccess(res, decision, 201);
    } catch (err) {
      next(err);
    }
  },

  async requestInformation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');
      const validatedInput = requestInformationSchema.parse(req.body);

      const claim = await reviewService.requestInformation(req.user.id, claimId, validatedInput);
      sendSuccess(res, claim);
    } catch (err) {
      next(err);
    }
  },

  async listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      // Authorize access by fetching claim
      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const decisions = await reviewRepository.findByClaimId(claimId);
      sendSuccess(res, decisions);
    } catch (err) {
      next(err);
    }
  },

  async listMissingInformation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claimId = getParam(req, 'id');

      await claimService.getClaimById(req.user.id, req.user.role, claimId);

      const missing = await missingInfoRepository.findByClaimId(claimId);
      sendSuccess(res, missing);
    } catch (err) {
      next(err);
    }
  },
};
