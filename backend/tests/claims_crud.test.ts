import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';

describe('Claims CRUD & Ownership Isolation', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('validates claim creation payload (rejects invalid date and negative amounts)', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-123',
        claim_type: 'AUTO',
        title: 'Accident',
        description: 'Crash',
        incident_date: 'invalid-date',
        claim_amount: -500,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates claim with status SUBMITTED and generates claim number', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Rear bumper collision',
        description: 'Struck by another vehicle at low speed in parking lot.',
        incident_date: '2026-03-10',
        claim_amount: 1850.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.claim_number).toMatch(/^CLM-\d{8}-\d{4}$/);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.claimant_id).toBe('11111111-0000-0000-0000-000000000001');

    // Verify claim timeline event was created
    const eventsRes = await request(app)
      .get(`/api/claims/${res.body.data.id}/events`)
      .set('Authorization', 'Bearer mock-token-claimant');
    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.data.length).toBeGreaterThan(0);
    expect(eventsRes.body.data[0].type).toBe('claim_created');
  });

  it('PREVENTS a claimant from accessing another claimant\'s claim (returns 403)', async () => {
    // 1. Claimant 1 creates a claim
    const createRes = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Claimant 1 private claim',
        description: 'Private damage report',
        incident_date: '2026-01-15',
        claim_amount: 3000,
      });
    expect(createRes.status).toBe(201);
    const claimId = createRes.body.data.id;

    // 2. Claimant 2 attempts to fetch Claimant 1's claim
    const unauthorizedRes = await request(app)
      .get(`/api/claims/${claimId}`)
      .set('Authorization', 'Bearer mock-token-other-claimant');
    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.success).toBe(false);
    expect(unauthorizedRes.body.error.code).toBe('AUTHORIZATION_ERROR');

    // 3. Claims Officer can access Claimant 1's claim
    const officerRes = await request(app)
      .get(`/api/claims/${claimId}`)
      .set('Authorization', 'Bearer mock-token-officer');
    expect(officerRes.status).toBe(200);
    expect(officerRes.body.data.id).toBe(claimId);
  });

  it('allows claimant to update unreviewed claim details, but prevents changing status', async () => {
    const createRes = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Initial Title',
        description: 'Initial Description',
        incident_date: '2026-01-20',
        claim_amount: 1500,
      });
    const claimId = createRes.body.data.id;

    // Attempt update with changed status
    const updateRes = await request(app)
      .patch(`/api/claims/${claimId}`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        title: 'Updated Title by Claimant',
        status: 'APPROVED', // Claimant should NOT be able to change status to APPROVED!
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated Title by Claimant');
    expect(updateRes.body.data.status).toBe('SUBMITTED'); // Status remains SUBMITTED
  });
});
