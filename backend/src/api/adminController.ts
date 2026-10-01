import { Request, Response, NextFunction } from 'express';
import {
  claimRepository,
  userPolicyRepository,
  reviewRepository,
  settlementRepository,
  eventRepository,
  auditRepository,
  agentRepository,
  evidenceRepository,
} from '../repositories/index.js';
import { policyService } from '../services/policyService.js';
import { reviewService } from '../claims/reviewService.js';
import { settlementService } from '../claims/settlementService.js';
import { savePolicySchema, updatePolicySchema, updatePricingSchema } from '../schemas/policy.js';
import { reviewDecisionSchema } from '../schemas/review.js';
import { settleClaimSchema } from '../schemas/settlement.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError, NotFoundError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const adminController = {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();

      const allClaims = await claimRepository.findAll();
      const allPolicies = await userPolicyRepository.findAll();
      const allAuditLogs = await auditRepository.findAll();

      const activePolicies = allPolicies.filter((p) => p.status === 'ACTIVE').length;
      const claimsRequiringReview = allClaims.filter(
        (c) => c.requires_human_review || c.status === 'UNDER_REVIEW'
      ).length;
      const settledClaims = allClaims.filter((c) => c.status === 'SETTLED');
      const pendingSettlements = allClaims.filter(
        (c) => c.status === 'APPROVED' && !c.requires_human_review
      ).length;

      const totalSettledAmount = settledClaims.reduce((acc, c) => acc + (c.claim_amount || 0), 0);

      sendSuccess(res, {
        kpi: {
          totalPolicies: allPolicies.length,
          activePolicies,
          totalClaims: allClaims.length,
          claimsRequiringReview,
          pendingSettlements,
          totalSettledAmount,
        },
        recentActivity: allAuditLogs.slice(0, 10),
      });
    } catch (err) {
      next(err);
    }
  },

  async listPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const policies = await userPolicyRepository.findAll();
      sendSuccess(res, policies);
    } catch (err) {
      next(err);
    }
  },

  async createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const validatedInput = savePolicySchema.parse(req.body);
      const policy = await policyService.confirmAndSavePolicy(req.user.id, validatedInput);
      sendSuccess(res, policy, 201);
    } catch (err) {
      next(err);
    }
  },

  async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const validatedInput = updatePolicySchema.parse(req.body);
      const policy = await policyService.updatePolicy(req.user.id, req.user.role, id, validatedInput);
      sendSuccess(res, policy);
    } catch (err) {
      next(err);
    }
  },

  async updatePricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const validatedPricing = updatePricingSchema.parse(req.body);
      const policy = await policyService.updatePricing(req.user.id, id, validatedPricing);
      sendSuccess(res, policy);
    } catch (err) {
      next(err);
    }
  },

  async listClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { status, requires_review } = req.query;

      let claims = await claimRepository.findAll();

      if (status && typeof status === 'string') {
        claims = claims.filter((c) => c.status.toLowerCase() === status.toLowerCase());
      }
      if (requires_review === 'true') {
        claims = claims.filter((c) => c.requires_human_review || c.status === 'UNDER_REVIEW');
      }

      sendSuccess(res, claims);
    } catch (err) {
      next(err);
    }
  },

  async getClaimDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');

      const claim = await claimRepository.findById(id);
      if (!claim) throw new NotFoundError('Claim not found');

      const runs = await agentRepository.getRunsByClaimId(id);
      const findings = await agentRepository.getFindingsByClaimId(id);
      const evidence = await evidenceRepository.findByClaimId(id);
      const events = await eventRepository.findByClaimId(id);
      const reviews = await reviewRepository.findByClaimId(id);
      const settlement = await settlementRepository.findByClaimId(id);
      const audits = await auditRepository.findByEntity('claims', id);

      sendSuccess(res, {
        claim,
        agentRuns: runs,
        findings,
        evidence,
        events,
        reviews,
        settlement,
        auditLogs: audits,
      });
    } catch (err) {
      next(err);
    }
  },

  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const validatedInput = reviewDecisionSchema.parse(req.body);

      const decision = await reviewService.submitReview(req.user.id, id, validatedInput);
      sendSuccess(res, decision, 201);
    } catch (err) {
      next(err);
    }
  },

  async settleClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const validatedInput = settleClaimSchema.parse(req.body);

      const settlement = await settlementService.settleClaim(
        req.user.id,
        req.user.role,
        id,
        validatedInput
      );
      sendSuccess(res, settlement);
    } catch (err) {
      next(err);
    }
  },
};
