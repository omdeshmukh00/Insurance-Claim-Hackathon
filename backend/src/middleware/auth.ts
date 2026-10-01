import { Request, Response, NextFunction } from 'express';
import { UserRole, Profile } from '../types/database.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { isSupabaseConfigured, getSupabaseAdmin } from '../config/supabase.js';
import { profileRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates Supabase JWT from Authorization header and loads authenticated user profile.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or malformed Authorization header. Expected Bearer token.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new AuthenticationError('Empty bearer token provided');
    }

    let userId: string | null = null;
    let email: string | null = null;

    if (isSupabaseConfigured()) {
      const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !user) {
        logger.warn('Supabase JWT verification failed', { error: error?.message });
        throw new AuthenticationError('Invalid or expired authentication token');
      }
      userId = user.id;
      email = user.email || '';
    } else {
      // Local development / testing token resolver
      // Accepts:
      // 1. "mock-token-claimant" -> Alice Claimant (CLAIMANT)
      // 2. "mock-token-other-claimant" -> Bob Claimant (CLAIMANT)
      // 3. "mock-token-officer" -> Charlie Officer (CLAIMS_OFFICER)
      // 4. "mock-token-investigator" -> Dana Investigator (INVESTIGATOR)
      // 5. "mock-token-admin" -> Evan Admin (ADMIN)
      // 6. "test-token:<userId>" -> looks up existing profile or creates one
      if (token === 'mock-token-claimant') {
        userId = '11111111-0000-0000-0000-000000000001';
        email = 'claimant@example.com';
      } else if (token === 'mock-token-other-claimant') {
        userId = '11111111-0000-0000-0000-000000000002';
        email = 'other_claimant@example.com';
      } else if (token === 'mock-token-officer') {
        userId = '22222222-0000-0000-0000-000000000002';
        email = 'officer@example.com';
      } else if (token === 'mock-token-investigator') {
        userId = '33333333-0000-0000-0000-000000000003';
        email = 'investigator@example.com';
      } else if (token === 'mock-token-admin') {
        userId = '44444444-0000-0000-0000-000000000004';
        email = 'admin@example.com';
      } else if (token.startsWith('test-token:')) {
        userId = token.replace('test-token:', '');
        email = `${userId}@example.com`;
      } else {
        // Simple base64/payload fallback for mock testing
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            userId = payload.sub || payload.id;
            email = payload.email || '';
          }
        } catch {
          // ignore
        }
      }

      if (!userId) {
        throw new AuthenticationError('Invalid authentication token');
      }
    }

    // Look up or establish trusted server-side profile
    let profile: Profile | null = await profileRepository.findById(userId);
    if (!profile) {
      profile = await profileRepository.upsert({
        id: userId,
        email: email || `${userId}@example.com`,
        full_name: 'Authenticated User',
        role: 'CLAIMANT', // default role
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      token,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Reusable guard requiring an exact role (e.g. requireRole("ADMIN"))
 */
export function requireRole(requiredRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before role check'));
    }

    if (req.user.role !== requiredRole) {
      return next(
        new AuthorizationError(
          `Forbidden: Role '${req.user.role}' is not authorized. Required: '${requiredRole}'`
        )
      );
    }

    next();
  };
}

/**
 * Reusable guard requiring at least one of the specified roles
 * e.g. requireAnyRole("CLAIMS_OFFICER", "INVESTIGATOR", "ADMIN")
 */
export function requireAnyRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before role check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Forbidden: Role '${req.user.role}' is not authorized. Allowed: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}
