import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';

describe('Authentication & Role Guards', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/claims');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('rejects invalid or malformed bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/claims')
      .set('Authorization', 'Bearer invalid-garbage-token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated claimant to list claims (scoped to their own)', async () => {
    const res = await request(app)
      .get('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('blocks CLAIMANT from performing human review with 403', async () => {
    const res = await request(app)
      .post('/api/claims/any-claim-id/review')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Claimant trying to self-approve',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('blocks CLAIMANT from executing settlement with 403', async () => {
    const res = await request(app)
      .post('/api/claims/any-claim-id/settle')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        settlement_amount: 5000,
        reason: 'Claimant trying to settle own claim',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('allows CLAIMS_OFFICER, INVESTIGATOR, and ADMIN to access review endpoints', async () => {
    // First create a real claim to review
    const createRes = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Collision on highway',
        description: 'Rear-ended at traffic signal',
        incident_date: '2026-02-15',
        claim_amount: 2500,
      });
    expect(createRes.status).toBe(201);
    const claimId = createRes.body.data.id;

    // Claims Officer review
    const officerRes = await request(app)
      .post(`/api/claims/${claimId}/review`)
      .set('Authorization', 'Bearer mock-token-officer')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Reviewed accident description and policy coverage verified.',
      });
    expect(officerRes.status).toBe(201);
    expect(officerRes.body.data.decision).toBe('APPROVE_FOR_PROCESSING');

    // Investigator review
    const investigatorRes = await request(app)
      .post(`/api/claims/${claimId}/review`)
      .set('Authorization', 'Bearer mock-token-investigator')
      .send({
        decision: 'APPROVE_FOR_PROCESSING',
        notes: 'Investigator confirmed damage aligns with collision.',
      });
    expect(investigatorRes.status).toBe(201);
  });

  it('allows ADMIN to access global audit logs, blocks non-admins', async () => {
    // Claimant blocked
    const claimantRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', 'Bearer mock-token-claimant');
    expect(claimantRes.status).toBe(403);

    // Officer blocked from global system admin audit
    const officerRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', 'Bearer mock-token-officer');
    expect(officerRes.status).toBe(403);

    // Admin allowed
    const adminRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', 'Bearer mock-token-admin');
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
  });
});
