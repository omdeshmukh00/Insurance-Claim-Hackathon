import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';

describe('Document Upload & Storage', () => {
  let claimId: string;

  beforeEach(async () => {
    inMemoryStore.clear();

    // Create a base claim
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Collision Claim',
        description: 'Auto accident evidence documents',
        incident_date: '2026-02-10',
        claim_amount: 3200,
      });
    claimId = res.body.data.id;
  });

  it('successfully uploads valid PDF document and creates metadata record', async () => {
    // Valid PDF buffer starting with %PDF-1.4
    const validPdfBuffer = Buffer.from('%PDF-1.4 sample pdf content for claim verification');

    const res = await request(app)
      .post(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .field('document_type', 'POLICE_REPORT')
      .attach('file', validPdfBuffer, {
        filename: 'police_report.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.claim_id).toBe(claimId);
    expect(res.body.data.file_name).toBe('police_report.pdf');
    expect(res.body.data.mime_type).toBe('application/pdf');
    expect(res.body.data.document_type).toBe('POLICE_REPORT');
    expect(res.body.data.processing_status).toBe('UPLOADED');
  });

  it('rejects spoofed file with fake extension and invalid magic bytes', async () => {
    // Declared as PDF, but content is random text without %PDF
    const spoofedBuffer = Buffer.from('FAKE NOT A REAL PDF OR PNG');

    const res = await request(app)
      .post(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .field('document_type', 'REPAIR_ESTIMATE')
      .attach('file', spoofedBuffer, {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('allows downloading uploaded document with correct MIME type', async () => {
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

    const uploadRes = await request(app)
      .post(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .field('document_type', 'DAMAGE_PHOTO')
      .attach('file', validPngBuffer, {
        filename: 'damage_photo.png',
        contentType: 'image/png',
      });
    expect(uploadRes.status).toBe(201);
    const docId = uploadRes.body.data.id;

    // Download document
    const downloadRes = await request(app)
      .get(`/api/claims/${claimId}/documents/${docId}/download`)
      .set('Authorization', 'Bearer mock-token-claimant');

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toContain('image/png');
  });

  it('prevents other claimants from accessing or downloading documents', async () => {
    const validPdf = Buffer.from('%PDF-1.4 confidential claimant invoice');
    const uploadRes = await request(app)
      .post(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .field('document_type', 'MEDICAL_BILL')
      .attach('file', validPdf, {
        filename: 'medical.pdf',
        contentType: 'application/pdf',
      });
    const docId = uploadRes.body.data.id;

    // Unauthorized claimant tries to list documents
    const listRes = await request(app)
      .get(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-other-claimant');
    expect(listRes.status).toBe(403);

    // Unauthorized claimant tries to download document
    const downloadRes = await request(app)
      .get(`/api/claims/${claimId}/documents/${docId}/download`)
      .set('Authorization', 'Bearer mock-token-other-claimant');
    expect(downloadRes.status).toBe(403);
  });
});
