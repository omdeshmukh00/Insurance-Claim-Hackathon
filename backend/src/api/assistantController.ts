import { Request, Response, NextFunction } from 'express';
import { assistantAgent } from '../agents/assistantAgent.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { z } from 'zod';

const assistantQuerySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  claimId: z.string().optional(),
  policyId: z.string().optional(),
});

export const assistantController = {
  async handleQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { message, claimId, policyId } = assistantQuerySchema.parse(req.body);

      const response = await assistantAgent.processUserQuery(
        req.user.id,
        message,
        claimId,
        policyId
      );

      sendSuccess(res, {
        ...response,
        reply: response.answer,
      });
    } catch (err) {
      next(err);
    }
  },
};
