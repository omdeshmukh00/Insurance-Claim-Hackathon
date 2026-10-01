import {
  claimRepository,
  reviewRepository,
  eventRepository,
  auditRepository,
  missingInfoRepository,
} from '../repositories/index.js';
import { ReviewDecisionInput, RequestInformationInput } from '../schemas/review.js';
import { ReviewDecision, Claim, ClaimStatus } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';
import { emailService } from '../services/emailService.js';
import { logger } from '../utils/logger.js';

export const reviewService = {
  async submitReview(
    reviewerId: string,
    claimId: string,
    input: ReviewDecisionInput
  ): Promise<ReviewDecision> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim ${claimId} not found`);
    }

    const decisionRecord = await reviewRepository.create({
      claim_id: claimId,
      reviewer_id: reviewerId,
      decision: input.decision,
      notes: input.notes,
    });

    let newStatus: ClaimStatus;
    switch (input.decision) {
      case 'APPROVE_FOR_PROCESSING':
        newStatus = 'APPROVED';
        break;
      case 'REQUEST_INFORMATION':
        newStatus = 'REQUIRES_INFO';
        break;
      case 'ESCALATE':
        newStatus = 'UNDER_INVESTIGATION';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
    }

    await claimRepository.update(claimId, {
      status: newStatus,
      requires_human_review: false,
      assigned_officer_id: reviewerId,
    });

    // Save claim timeline event
    await eventRepository.create({
      claim_id: claimId,
      type: 'review_completed',
      actor_type: 'USER',
      actor: reviewerId,
      status: newStatus,
      message: `Review completed with decision: ${input.decision}. Notes: ${input.notes}`,
      metadata: { decision: input.decision, notes: input.notes },
    });

    // Create audit log
    await auditRepository.create({
      actor_type: 'USER',
      actor_id: reviewerId,
      action: 'REVIEW_DECISION_RECORDED',
      entity_type: 'review_decisions',
      entity_id: decisionRecord.id,
      metadata: { claim_id: claimId, decision: input.decision, notes: input.notes },
    });

    // Dispatch email notifications decoupled from transaction
    const updatedClaim = (await claimRepository.findById(claimId)) || claim;
    if (input.decision === 'APPROVE_FOR_PROCESSING') {
      emailService
        .sendClaimApprovedNotification(updatedClaim, updatedClaim.claim_amount, input.notes)
        .catch((err) => logger.warn('Failed to send claim approved email', { error: err.message }));
    } else if (input.decision === 'REJECT') {
      emailService
        .sendClaimRejectedNotification(updatedClaim, input.notes)
        .catch((err) => logger.warn('Failed to send claim rejected email', { error: err.message }));
    }

    return decisionRecord;
  },

  async requestInformation(
    staffId: string,
    claimId: string,
    input: RequestInformationInput
  ): Promise<Claim> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim ${claimId} not found`);
    }

    for (const item of input.required_items) {
      await missingInfoRepository.create({
        claim_id: claimId,
        required_item: item,
        reason: input.reason,
        priority: 'HIGH',
        status: 'REQUESTED',
        context_evidence_ids: [],
      });
    }

    const updatedClaim = await claimRepository.update(claimId, {
      status: 'REQUIRES_INFO',
    });

    await eventRepository.create({
      claim_id: claimId,
      type: 'missing_information_detected',
      actor_type: 'USER',
      actor: staffId,
      status: 'REQUIRES_INFO',
      message: `Staff requested ${input.required_items.length} information item(s): ${input.required_items.join(', ')}`,
      metadata: { reason: input.reason, items: input.required_items },
    });

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: staffId,
      action: 'INFORMATION_REQUESTED_BY_STAFF',
      entity_type: 'claims',
      entity_id: claimId,
      metadata: { required_items: input.required_items, reason: input.reason },
    });

    // Decoupled email
    if (updatedClaim) {
      emailService
        .sendMissingInfoNotification(updatedClaim, input.required_items)
        .catch((err) => logger.warn('Failed to send missing info email', { error: err.message }));
    }

    return updatedClaim!;
  },
};
