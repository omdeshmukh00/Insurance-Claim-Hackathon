import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { inMemoryStore } from '../src/repositories/inMemoryStore.js';
import { claimInvestigationService } from '../src/orchestration/claimInvestigationService.js';
import { documentAgent } from '../src/agents/documentAgent.js';
import { policyAgent } from '../src/agents/policyAgent.js';
import { coverageAgent } from '../src/agents/coverageAgent.js';
import { anomalyAgent } from '../src/agents/anomalyAgent.js';
import { missingInformationAgent } from '../src/agents/missingInformationAgent.js';
import { assessmentAgent } from '../src/agents/assessmentAgent.js';
import { documentRepository, evidenceRepository } from '../src/repositories/index.js';

describe('Multi-Agent AI Pipeline & Evidence Corroboration', () => {
  let claimId: string;

  beforeEach(async () => {
    inMemoryStore.clear();

    const claimRes = await request(app)
      .post('/api/claims')
      .set('Authorization', 'Bearer mock-token-claimant')
      .send({
        policy_number: 'POL-AUTO-2026-001',
        claim_type: 'AUTO',
        title: 'Collision on Highway 101',
        description: 'Rear-ended vehicle after sudden braking. Damage to trunk and bumper.',
        incident_date: '2026-02-14',
        claim_amount: 4500,
      });
    claimId = claimRes.body.data.id;

    // Attach sample claim document
    const pdfBuf = Buffer.from('%PDF-1.4 Repair estimate from licensed shop totaling $4500 for collision');
    await request(app)
      .post(`/api/claims/${claimId}/documents`)
      .set('Authorization', 'Bearer mock-token-claimant')
      .field('document_type', 'REPAIR_ESTIMATE')
      .attach('file', pdfBuf, {
        filename: 'estimate.pdf',
        contentType: 'application/pdf',
      });
  });

  it('Document Agent extracts fields and preserves source evidence', async () => {
    const claim = (await inMemoryStore.claims.get(claimId))!;
    const docs = await documentRepository.findByClaimId(claimId);

    const docOutput = await documentAgent.processDocument(claim, docs[0]);
    expect(docOutput.documentId).toBe(docs[0].id);
    expect(docOutput.evidenceItems.length).toBeGreaterThan(0);
    expect(docOutput.evidenceItems[0].source_text).toBeDefined();
    expect(docOutput.evidenceItems[0].page_number).toBeGreaterThanOrEqual(1);
  });

  it('Policy / RAG Agent retrieves clauses and preserves document ID and section evidence', async () => {
    const claim = (await inMemoryStore.claims.get(claimId))!;
    const policyOutput = await policyAgent.retrievePolicyClauses(claim);

    expect(policyOutput.clauses.length).toBeGreaterThan(0);
    expect(policyOutput.clauses[0].section).toBeDefined();
    expect(policyOutput.clauses[0].text).toContain('Collision');
    expect(policyOutput.evidenceIds.length).toBe(policyOutput.clauses.length);
  });

  it('Coverage Agent evaluates claim against policy clauses with supporting evidence IDs', async () => {
    const claim = (await inMemoryStore.claims.get(claimId))!;
    const policyOutput = await policyAgent.retrievePolicyClauses(claim);
    const docEvidence = await evidenceRepository.findByClaimId(claimId);

    const coverageOutput = await coverageAgent.evaluateCoverage(
      claim,
      policyOutput.clauses,
      docEvidence
    );

    expect(coverageOutput.status).toMatch(/COVERED|POTENTIALLY_COVERED|REQUIRES_REVIEW/);
    expect(coverageOutput.reason).toBeDefined();
    expect(coverageOutput.confidence).toBeGreaterThan(0);
    expect(coverageOutput.evidenceIds.length).toBeGreaterThan(0);
  });

  it('Anomaly Agent uses objective terminology without labelling fraud directly', async () => {
    const claim = (await inMemoryStore.claims.get(claimId))!;
    const docs = await documentRepository.findByClaimId(claimId);
    const docOutput = await documentAgent.processDocument(claim, docs[0]);
    const evidence = await evidenceRepository.findByClaimId(claimId);

    const anomalyOutput = await anomalyAgent.detectAnomalies(claim, [docOutput], evidence);

    // Verify objective terminology
    expect(anomalyOutput.summary).not.toMatch(/\bfraud\b/i);
    for (const finding of anomalyOutput.findings) {
      expect(finding.title).toMatch(/Potential Inconsistency|Anomaly|Requires Verification/i);
      expect(finding.evidence_ids.length).toBeGreaterThan(0);
    }
  });

  it('Assessment Agent synthesizes all findings into complexity, recommendation and evidence IDs', async () => {
    const claim = (await inMemoryStore.claims.get(claimId))!;
    const docs = await documentRepository.findByClaimId(claimId);
    const docOutput = await documentAgent.processDocument(claim, docs[0]);
    const policyOutput = await policyAgent.retrievePolicyClauses(claim);
    const evidence = await evidenceRepository.findByClaimId(claimId);

    const coverage = await coverageAgent.evaluateCoverage(claim, policyOutput.clauses, evidence);
    const anomalies = await anomalyAgent.detectAnomalies(claim, [docOutput], evidence);
    const missingInfo = await missingInformationAgent.evaluateMissingInformation(
      claim,
      docs,
      [docOutput],
      evidence
    );

    const allEvidenceIds = evidence.map((e) => e.id);
    const assessment = await assessmentAgent.produceAssessment(
      claim,
      coverage,
      anomalies,
      missingInfo,
      allEvidenceIds
    );

    expect(assessment.complexity).toMatch(/LOW|MEDIUM|HIGH/);
    expect(assessment.recommendation).toMatch(/automated_processing|human_review/);
    expect(assessment.evidence_ids.length).toBeGreaterThan(0);
    expect(assessment.reasons.length).toBeGreaterThan(0);
  });

  it('POST /api/claims/:id/investigate orchestrates all agents end-to-end and records timeline events', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/investigate`)
      .set('Authorization', 'Bearer mock-token-claimant');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.claimId).toBe(claimId);
    expect(res.body.data.assessment).toBeDefined();
    expect(res.body.data.totalEvidenceCount).toBeGreaterThan(0);

    // Verify timeline events recorded
    const eventsRes = await request(app)
      .get(`/api/claims/${claimId}/events`)
      .set('Authorization', 'Bearer mock-token-claimant');

    expect(eventsRes.status).toBe(200);
    const eventTypes = eventsRes.body.data.map((e: any) => e.type);

    expect(eventTypes).toContain('investigation_started');
    expect(eventTypes).toContain('agent_started');
    expect(eventTypes).toContain('agent_completed');
    expect(eventTypes).toContain('assessment_completed');
  });
});
