import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { emailTemplateService } from '../src/services/emailTemplateService.js';
import { emailService } from '../src/services/emailService.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';
import nodemailer from 'nodemailer';

vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
  sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-msg-12345' }),
} as any);

describe('Email Templates, SMTP Service & CORS', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  describe('CORS Configuration', () => {
    it('sets CORS headers on preflight OPTIONS request', async () => {
      const res = await request(app)
        .options('/api/claims')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('exposes X-Request-Id header in responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('HTML Email Templates', () => {
    const sampleData = {
      recipientName: 'Jane Doe',
      claimNumber: 'CLM-20261001-1234',
      claimTitle: 'Vehicle Collision',
      claimAmount: 2500,
      currency: 'USD',
      status: 'APPROVED',
      reason: 'Damage verified against collision coverage.',
      missingItems: ['Accident Police Report', 'Repair Estimate'],
    };

    const templates = [
      'claim-submitted',
      'investigation-complete',
      'missing-information',
      'human-review',
      'claim-approved',
      'claim-settled',
      'claim-rejected',
    ];

    for (const tName of templates) {
      it(`renders valid responsive HTML and text for "${tName}"`, () => {
        const rendered = emailTemplateService.render(tName, sampleData);
        expect(rendered.subject).toContain('CLM-20261001-1234');
        expect(rendered.text.length).toBeGreaterThan(10);
        expect(rendered.html).toContain('<!DOCTYPE html>');
        expect(rendered.html).toContain('Insurance Claims Intelligence');
        expect(rendered.html).toContain('CLM-20261001-1234');
      });
    }
  });

  describe('Decoupled Email Delivery & Logging', () => {
    it('records email dispatch into email_logs without crashing', async () => {
      const log = await emailService.sendEmail({
        to: 'test@example.com',
        template: 'claim-submitted',
        data: {
          recipientName: 'Test Claimant',
          claimNumber: 'CLM-20261001-9999',
          claimAmount: 1200,
        },
      });

      expect(log.id).toBeDefined();
      expect(log.recipient).toBe('test@example.com');
      expect(log.template).toBe('claim-submitted');
      expect(log.status).toMatch(/SENT|SIMULATED/);
      expect(inMemoryStore.emailLogs.has(log.id)).toBe(true);
    }, 15000);
  });
});
