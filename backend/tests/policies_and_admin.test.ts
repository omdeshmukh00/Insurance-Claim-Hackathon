import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';

describe('Policy Upload, AI Assistant, and Admin Role Authorization', () => {
  const claimantToken = 'mock-token-claimant';
  const otherClaimantToken = 'mock-token-other-claimant';
  const adminToken = 'mock-token-admin';

  beforeEach(() => {
    inMemoryStore.clear();
  });

  describe('Admin Role Guard & Endpoint Access', () => {
    it('rejects unauthenticated requests to /api/admin/dashboard with 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects regular claimant requests to /api/admin/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Role 'CLAIMANT' is not authorized");
    });

    it('rejects claimant attempting to update policy pricing with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/admin/policies/POL-MOCK-1/pricing')
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({ premium: 50000 });

      expect(res.status).toBe(403);
    });

    it('allows ADMIN to access dashboard and retrieve operational KPIs', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpi).toBeDefined();
      expect(res.body.data.kpi.totalPolicies).toBeGreaterThanOrEqual(1);
    });

    it('allows ADMIN to update policy pricing and deductible', async () => {
      const policies = await request(app)
        .get('/api/admin/policies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(policies.status).toBe(200);
      const targetPolicy = policies.body.data[0];

      const updateRes = await request(app)
        .patch(`/api/admin/policies/${targetPolicy.id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          premium: 65000,
          deductible: 4500,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.premium).toBe(65000);
      expect(updateRes.body.data.deductible).toBe(4500);
    });
  });

  describe('Policy Upload, Extraction Preview, and Confirmation', () => {
    it('analyzes an uploaded policy document and returns structured preview with evidence', async () => {
      const uploadRes = await request(app)
        .post('/api/policies/upload')
        .set('Authorization', `Bearer ${claimantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 Mock Insurance Policy Document'), 'motor-policy.pdf');

      expect(uploadRes.status).toBe(200);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.analysis.policy_number).toBeDefined();
      expect(uploadRes.body.data.analysis.covered_events).toBeInstanceOf(Array);
      expect(uploadRes.body.data.analysis.extracted_evidence).toBeInstanceOf(Array);
      expect(uploadRes.body.data.storagePath).toBeDefined();
    });

    it('confirms and saves the reviewed policy for the user', async () => {
      const confirmRes = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({
          policy_number: 'POL-CUSTOM-999',
          insurer_name: 'Metro Shield Assurance',
          policy_name: 'Comprehensive Auto Shield',
          policy_type: 'AUTO',
          policyholder_name: 'Alice Claimant',
          start_date: '2026-01-01',
          expiry_date: '2027-01-01',
          premium: 48000,
          deductible: 5000,
          coverage: ['Accidental collision', 'Third-party liability'],
          exclusions: ['Drunk driving', 'Mechanical breakdown'],
          limits: ['$100,000 Property Damage', '$300,000 Bodily Injury'],
        });

      expect(confirmRes.status).toBe(201);
      expect(confirmRes.body.data.policy_number).toBe('POL-CUSTOM-999');

      const savedPolicyId = confirmRes.body.data.id;

      // Claimant can fetch their policy
      const getRes = await request(app)
        .get(`/api/policies/${savedPolicyId}`)
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.policy_number).toBe('POL-CUSTOM-999');

      // Other claimant cannot access this policy (403 Forbidden)
      const otherRes = await request(app)
        .get(`/api/policies/${savedPolicyId}`)
        .set('Authorization', `Bearer ${otherClaimantToken}`);

      expect(otherRes.status).toBe(403);
    });
  });

  describe('User AI Assistant', () => {
    it('answers queries grounded in authenticated user context and policies', async () => {
      const assistantRes = await request(app)
        .post('/api/assistant')
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({
          message: 'What active policies do I have and what is my deductible?',
        });

      expect(assistantRes.status).toBe(200);
      expect(assistantRes.body.success).toBe(true);
      expect(assistantRes.body.data.reply).toBeDefined();
      expect(assistantRes.body.data.answer).toBeDefined();
      expect(assistantRes.body.data.references).toBeInstanceOf(Array);
    }, 15000);
  });
});
