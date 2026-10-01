import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';

describe('Review, Settlement & Authorization Controls', () => {
  let claimId: string;

  beforeEach(async () => {
    inMemoryStore.clear();

    const claimRes = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Collision settlement candidate',
        description: 'Bumper damage after incident',
        incident_date: '2026-02-18',
        claim_amount: 3000,
      });
    claimId = claimRes.body.data.id;
  });

  it('allows CLAIMS_OFFICER to submit human review decision and updates claim status', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/review`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Damage substantiated by vehicle photos and shop estimate.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.decision).toBe('APPROVE_FOR_PROCESSING');

    // Verify claim status transitioned to APPROVED
    const claimRes = await request(app)
      .get(`/api/claims/${claimId}`)
      .set('Authorization', 'Bearer mock-token-officer');
    expect(claimRes.body.data.status).toBe('APPROVED');
  });

  it('rejects settlement amount exceeding the claimed total', async () => {
    // Approve claim first
    await request(app)
      .post(`/api/claims/${claimId}/review`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Approved.',
      });

    // Attempt settlement of 5000 on a 3000 claim
    const res = await request(app)
      .post(`/api/claims/${claimId}/settle`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        settlement_amount: 5000,
        currency: 'USD',
        reason: 'Attempting excessive payout',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enforces human review prerequisite before settlement when flagged for human review', async () => {
    // Manually mark claim as requiring human review and in UNDER_REVIEW status
    const claim = inMemoryStore.claims.get(claimId)!;
    claim.requires_human_review = true;
    claim.status = 'UNDER_REVIEW';

    // Attempt to settle directly without formal approval
    const res = await request(app)
      .post(`/api/claims/${claimId}/settle`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        settlement_amount: 2500,
        reason: 'Attempting settlement before formal review completion',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('formal officer approval');
  });

  it('successfully authorizes and finalizes settlement by CLAIMS_OFFICER', async () => {
    // 1. Approve claim
    await request(app)
      .post(`/api/claims/${claimId}/review`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Documentation complete, approved for payout.',
      });

    // 2. Finalize settlement
    const settleRes = await request(app)
      .post(`/api/claims/${claimId}/settle`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        settlement_amount: 2500, // $3000 - $500 deductible
        currency: 'USD',
        reason: 'Approved repair estimate minus $500 policy deductible.',
        payment_reference: 'WIRE-2026-991',
      });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.success).toBe(true);
    expect(settleRes.body.data.settlement_amount).toBe(2500);
    expect(settleRes.body.data.status).toBe('PROCESSED');

    // 3. Verify claim status is now SETTLED
    const claimRes = await request(app)
      .get(`/api/claims/${claimId}`)
      .set('Authorization', 'Bearer mock-token-claimant');
    expect(claimRes.body.data.status).toBe('SETTLED');

    // 4. Verify settlement record query
    const recordRes = await request(app)
      .get(`/api/claims/${claimId}/settlement`)
      .set('Authorization', 'Bearer mock-token-claimant');
    expect(recordRes.status).toBe(200);
    expect(recordRes.body.data.settlement_amount).toBe(2500);
  });

  it('AI settlement recommendation provides calculation breakdown and evidence references', async () => {
    const recRes = await request(app)
      .get(`/api/claims/${claimId}/settlement/recommendation`)
      .set('Authorization', 'Bearer mock-token-officer');

    expect(recRes.status).toBe(200);
    expect(recRes.body.data.recommended_amount).toBeDefined();
    expect(recRes.body.data.calculation_breakdown).toBeDefined();
    expect(Array.isArray(recRes.body.data.evidenceIds)).toBe(true);
  }, 15000);
});
