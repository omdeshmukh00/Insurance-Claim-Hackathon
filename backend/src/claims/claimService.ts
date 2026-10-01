import {
  claimRepository,
  eventRepository,
  auditRepository,
} from '../repositories/index.js';
import { Claim, UserRole } from '../types/database.js';
import { CreateClaimInput, UpdateClaimInput } from '../schemas/claim.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { emailService } from '../services/emailService.js';

function generateClaimNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CLM-${dateStr}-${rand}`;
}

export const claimService = {
  async createClaim(userId: string, input: CreateClaimInput): Promise<Claim> {
    const claimNumber = generateClaimNumber();

    const claim = await claimRepository.create({
      claimant_id: userId,
      claim_number: claimNumber,
      policy_number: input.policy_number,
      claim_type: input.claim_type,
      title: input.title,
      description: input.description,
      incident_date: input.incident_date,
      claim_amount: input.claim_amount,
      status: 'SUBMITTED',
      requires_human_review: false,
    });

    // Save claim event
    await eventRepository.create({
      claim_id: claim.id,
      type: 'claim_created',
      actor_type: 'USER',
      actor: userId,
      status: 'SUBMITTED',
      message: `Claim ${claimNumber} successfully submitted by claimant`,
      metadata: { claim_number: claimNumber, claim_amount: input.claim_amount },
    });

    // Create audit log
    await auditRepository.create({
      actor_type: 'USER',
      actor_id: userId,
      action: 'CLAIM_CREATED',
      entity_type: 'claims',
      entity_id: claim.id,
      metadata: { claim_number: claimNumber, claim_type: input.claim_type },
    });

    logger.info(`Claim created: ${claim.id} (${claimNumber}) by user ${userId}`);

    // Trigger notification email asynchronously (non-blocking)
    emailService
      .sendClaimSubmittedNotification(claim)
      .catch((err) => logger.warn('Failed to send claim submitted email', { error: err.message }));

    return claim;
  },

  async getClaimById(userId: string, role: UserRole, claimId: string): Promise<Claim> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID ${claimId} not found`);
    }

    if (role === 'CLAIMANT' && claim.claimant_id !== userId) {
      throw new AuthorizationError('You do not have access to view this claim');
    }

    return claim;
  },

  async listClaims(userId: string, role: UserRole): Promise<Claim[]> {
    if (role === 'CLAIMANT') {
      return claimRepository.findByClaimantId(userId);
    }
    // Staff roles (CLAIMS_OFFICER, INVESTIGATOR, ADMIN) can list all claims
    return claimRepository.findAll();
  },

  async updateClaim(
    userId: string,
    role: UserRole,
    claimId: string,
    updates: UpdateClaimInput
  ): Promise<Claim> {
    const claim = await this.getClaimById(userId, role, claimId);

    // If claimant, enforce restricted editable fields and status constraint
    if (role === 'CLAIMANT') {
      if (claim.status !== 'SUBMITTED' && claim.status !== 'REQUIRES_INFO') {
        throw new ValidationError('Claimants can only update claims in SUBMITTED or REQUIRES_INFO status');
      }

      // Claimants are not allowed to update status, complexity, or assigned_officer_id
      const safeUpdates: Partial<Claim> = {};
      if (updates.title) safeUpdates.title = updates.title;
      if (updates.description) safeUpdates.description = updates.description;
      if (updates.incident_date) safeUpdates.incident_date = updates.incident_date;
      if (updates.claim_amount) safeUpdates.claim_amount = updates.claim_amount;

      const updated = await claimRepository.update(claimId, safeUpdates);
      if (!updated) throw new NotFoundError('Claim not found');

      await auditRepository.create({
        actor_type: 'USER',
        actor_id: userId,
        action: 'CLAIM_UPDATED',
        entity_type: 'claims',
        entity_id: claimId,
        metadata: safeUpdates,
      });

      return updated;
    }

    // Staff update
    const updated = await claimRepository.update(claimId, updates);
    if (!updated) throw new NotFoundError('Claim not found');

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: userId,
      action: 'CLAIM_UPDATED_BY_STAFF',
      entity_type: 'claims',
      entity_id: claimId,
      metadata: updates,
    });

    return updated;
  },
};
