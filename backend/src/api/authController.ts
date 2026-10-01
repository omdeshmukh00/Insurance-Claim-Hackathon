import { Request, Response, NextFunction } from 'express';
import { profileRepository } from '../repositories/index.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { UserRole } from '../types/database.js';

export const authController = {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const profile = await profileRepository.findById(req.user.id);
      sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        fullName: profile?.full_name || req.user.fullName || 'User',
        phone: profile?.phone || null,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { fullName, phone } = req.body;

      const updated = await profileRepository.update(req.user.id, {
        ...(fullName !== undefined && { full_name: fullName }),
        ...(phone !== undefined && { phone }),
      });

      sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        fullName: updated?.full_name || fullName,
        phone: updated?.phone || phone,
      });
    } catch (err) {
      next(err);
    }
  },

  async switchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { role } = req.body;
      const validRoles: UserRole[] = ['CLAIMANT', 'ADMIN', 'CLAIMS_OFFICER', 'INVESTIGATOR'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role: ${role}. Valid: ${validRoles.join(', ')}`);
      }

      await profileRepository.update(req.user.id, { role });
      req.user.role = role;

      sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role,
        message: `Role switched to ${role}`,
      });
    } catch (err) {
      next(err);
    }
  },
};
