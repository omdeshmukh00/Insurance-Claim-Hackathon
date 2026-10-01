import { Request, Response, NextFunction } from 'express';
import { policyService } from '../services/policyService.js';
import { savePolicySchema, updatePolicySchema } from '../schemas/policy.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';

export const policyController = {
  async uploadPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const file = req.file;
      if (!file) throw new ValidationError('No file uploaded. Supply policy file with key "file"');

      const result = await policyService.uploadAndAnalyze(req.user.id, file);
      sendSuccess(res, result, 200);
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

  async listPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const policies = await policyService.listUserPolicies(req.user.id);
      sendSuccess(res, policies);
    } catch (err) {
      next(err);
    }
  },

  async getPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const id = getParam(req, 'id');
      const policy = await policyService.getPolicyById(req.user.id, req.user.role, id);
      sendSuccess(res, policy);
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
};
