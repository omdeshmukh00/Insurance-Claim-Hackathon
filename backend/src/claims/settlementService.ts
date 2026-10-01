import {
  claimRepository,
  settlementRepository,
  eventRepository,
  auditRepository,
  evidenceRepository,
} from '../repositories/index.js';
import { SettleClaimInput } from '../schemas/settlement.js';
import { Settlement, UserRole } from '../types/database.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { settlementAgent, SettlementRecommendation } from '../agents/settlementAgent.js';
import { emailService } from '../services/emailService.js';
import { logger } from '../utils/logger.js';

export const settlementService = {
  async settleClaim(
    officerId: string,
    officerRole: UserRole,
    claimId: string,
    input: SettleClaimInput
  ): Promise<Settlement> {
    // 1. Authorization: Only CLAIMS_OFFICER and ADMIN can settle
    if (officerRole !== 'CLAIMS_OFFICER' && officerRole !== 'ADMIN') {
      throw new AuthorizationError('Only Claims Officers and Administrators are authorized to execute settlements');
    }

    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim ${claimId} not found`);
    }

    // 2. Validate claim status & human review requirement
    if (claim.status === 'SETTLED') {
      throw new ValidationError('Claim has already been settled');
    }

    if (claim.status === 'REJECTED') {
      throw new ValidationError('Cannot settle a rejected claim');
    }

    if (claim.requires_human_review && claim.status !== 'APPROVED') {
      throw new ValidationError(
        'This claim was flagged as requiring human review and must receive formal officer approval before settlement'
      );
    }

    // 3. Validate settlement amount
    if (input.settlement_amount > claim.claim_amount) {
      throw new ValidationError(
        `Settlement amount ($${input.settlement_amount}) cannot exceed the claimed total ($${claim.claim_amount})`
      );
    }

    // 4. Gather evidence IDs for the settlement
    const claimEvidence = await evidenceRepository.findByClaimId(claimId);
    const evidenceIds = claimEvidence.map((e) => e.id);

    const now = new Date().toISOString();

    // 5. Create settlement record
    const settlement = await settlementRepository.create({
      claim_id: claimId,
      settlement_amount: input.settlement_amount,
      currency: input.currency || 'USD',
      status: 'PROCESSED',
      approved_by: officerId,
      approved_at: now,
      reason: input.reason,
      evidence_ids: evidenceIds,
      payment_reference: input.payment_reference || `PAY-${Date.now()}`,
    });

    // 6. Update claim status to SETTLED
    const updatedClaim = await claimRepository.update(claimId, {
      status: 'SETTLED',
    });

    // 7. Record claim timeline event
    await eventRepository.create({
      claim_id: claimId,
      type: 'settlement_processed',
      actor_type: 'USER',
      actor: officerId,
      status: 'SETTLED',
      message: `Settlement of $${input.settlement_amount} ${input.currency || 'USD'} approved and processed by officer`,
      metadata: {
        settlement_id: settlement.id,
        amount: input.settlement_amount,
        currency: settlement.currency,
        reference: settlement.payment_reference,
      },
    });

    // 8. Record audit log
    await auditRepository.create({
      actor_type: 'USER',
      actor_id: officerId,
      action: 'CLAIM_SETTLED',
      entity_type: 'settlements',
      entity_id: settlement.id,
      metadata: {
        claim_id: claimId,
        amount: input.settlement_amount,
        reason: input.reason,
      },
    });

    logger.info(`Settlement processed for claim ${claimId}: $${input.settlement_amount}`);

    // 9. Send settlement email decoupled from transaction
    if (updatedClaim) {
      emailService
        .sendClaimSettledNotification(updatedClaim, input.settlement_amount)
        .catch((err) => logger.warn('Failed to send settlement email', { error: err.message }));
    }

    return settlement;
  },

  async getRecommendation(
    claimId: string
  ): Promise<SettlementRecommendation & { evidenceIds: string[] }> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) throw new NotFoundError(`Claim ${claimId} not found`);

    const evidence = await evidenceRepository.findByClaimId(claimId);
    return settlementAgent.recommendSettlement(claim, evidence);
  },

  async getSettlement(claimId: string): Promise<Settlement | null> {
    return settlementRepository.findByClaimId(claimId);
  },
};
