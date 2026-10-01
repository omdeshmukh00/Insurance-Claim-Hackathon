import { Request, Response, NextFunction } from 'express';
import { claimService } from '../claims/claimService.js';
import { createClaimSchema, updateClaimSchema } from '../schemas/claim.js';
import { sendSuccess } from '../utils/response.js';
import { eventRepository, evidenceRepository, assessmentRepository } from '../repositories/index.js';
import { AuthenticationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const claimController = {
  async createClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const validatedInput = createClaimSchema.parse(req.body);
      const claim = await claimService.createClaim(req.user.id, validatedInput);
      sendSuccess(res, claim, 201);
    } catch (err) {
      next(err);
    }
  },

  async listClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const claims = await claimService.listClaims(req.user.id, req.user.role);
      sendSuccess(res, claims);
    } catch (err) {
      next(err);
    }
  },

  async getClaimById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const claim = await claimService.getClaimById(req.user.id, req.user.role, id);
      sendSuccess(res, claim);
    } catch (err) {
      next(err);
    }
  },

  async updateClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const validatedInput = updateClaimSchema.parse(req.body);
      const claim = await claimService.updateClaim(req.user.id, req.user.role, id, validatedInput);
      sendSuccess(res, claim);
    } catch (err) {
      next(err);
    }
  },

  async getClaimEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      await claimService.getClaimById(req.user.id, req.user.role, id);
      const events = await eventRepository.findByClaimId(id);
      sendSuccess(res, events);
    } catch (err) {
      next(err);
    }
  },

  async getClaimEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      await claimService.getClaimById(req.user.id, req.user.role, id);
      const evidence = await evidenceRepository.findByClaimId(id);
      sendSuccess(res, evidence);
    } catch (err) {
      next(err);
    }
  },

  async getClaimAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      await claimService.getClaimById(req.user.id, req.user.role, id);
      const assessment = await assessmentRepository.findByClaimId(id);
      sendSuccess(res, assessment);
    } catch (err) {
      next(err);
    }
  },
};
