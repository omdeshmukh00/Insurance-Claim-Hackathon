import {
  claimRepository,
  documentRepository,
  eventRepository,
  auditRepository,
  agentRepository,
  evidenceRepository,
} from '../repositories/index.js';
import { documentAgent, DocumentAgentOutput } from '../agents/documentAgent.js';
import { policyAgent, PolicyAgentOutput } from '../agents/policyAgent.js';
import { coverageAgent, CoverageAgentOutput } from '../agents/coverageAgent.js';
import { anomalyAgent, AnomalyAgentOutput } from '../agents/anomalyAgent.js';
import { missingInformationAgent, MissingInfoAgentOutput } from '../agents/missingInformationAgent.js';
import { assessmentAgent } from '../agents/assessmentAgent.js';
import { emailService } from '../services/emailService.js';
import { Assessment, Claim } from '../types/database.js';
import { NotFoundError, AgentError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface InvestigationResult {
  claimId: string;
  claimNumber: string;
  status: string;
  documentResults: DocumentAgentOutput[];
  policyResults: PolicyAgentOutput;
  coverageResult: CoverageAgentOutput;
  anomalyResult: AnomalyAgentOutput;
  missingInfoResult: MissingInfoAgentOutput;
  assessment: Assessment;
  totalEvidenceCount: number;
}

export const claimInvestigationService = {
  async runInvestigation(claimId: string, actorId = 'system'): Promise<InvestigationResult> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim ${claimId} not found`);
    }

    logger.info(`Starting multi-agent investigation pipeline for claim ${claim.id} (${claim.claim_number})`);

    // 1. Mark claim as UNDER_INVESTIGATION
    await claimRepository.update(claimId, { status: 'UNDER_INVESTIGATION' });

    await eventRepository.create({
      claim_id: claimId,
      type: 'investigation_started',
      actor_type: actorId === 'system' ? 'SYSTEM' : 'USER',
      actor: actorId,
      status: 'RUNNING',
      message: 'Autonomous multi-agent claim investigation pipeline started',
    });

    await auditRepository.create({
      actor_type: actorId === 'system' ? 'SYSTEM' : 'USER',
      actor_id: actorId === 'system' ? null : actorId,
      action: 'INVESTIGATION_STARTED',
      entity_type: 'claims',
      entity_id: claimId,
    });

    try {
      const documents = await documentRepository.findByClaimId(claimId);

      // --- STEP 1: DOCUMENT AGENT ---
      const docRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'DOCUMENT',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'document_agent',
        status: 'RUNNING',
        message: `Document Agent inspecting ${documents.length} claim document(s)`,
      });

      const startTimeDoc = Date.now();
      const { results: documentResults, allEvidenceIds: docEvidenceIds } =
        await documentAgent.processAllClaimDocuments(claim, documents, docRun.id);

      await agentRepository.updateRun(docRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimeDoc,
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_completed',
        actor_type: 'AI_AGENT',
        actor: 'document_agent',
        status: 'COMPLETED',
        message: `Document Agent completed extraction across ${documents.length} document(s)`,
        metadata: { extractedEvidenceCount: docEvidenceIds.length },
      });

      // --- STEP 2: POLICY / RAG AGENT ---
      const policyRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'POLICY_RAG',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'policy_agent',
        status: 'RUNNING',
        message: `Policy Agent retrieving clauses for policy ${claim.policy_number}`,
      });

      const startTimePolicy = Date.now();
      const policyResults = await policyAgent.retrievePolicyClauses(claim, policyRun.id);

      await agentRepository.updateRun(policyRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimePolicy,
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_completed',
        actor_type: 'AI_AGENT',
        actor: 'policy_agent',
        status: 'COMPLETED',
        message: `Policy Agent retrieved ${policyResults.clauses.length} relevant clause(s)`,
      });

      // Fetch all evidence gathered so far
      const currentEvidence = await evidenceRepository.findByClaimId(claimId);

      // --- STEP 3: COVERAGE AGENT ---
      const coverageRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'COVERAGE',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'coverage_agent',
        status: 'RUNNING',
        message: 'Coverage Agent evaluating claim against retrieved policy clauses',
      });

      const startTimeCoverage = Date.now();
      const coverageResult = await coverageAgent.evaluateCoverage(
        claim,
        policyResults.clauses,
        currentEvidence,
        coverageRun.id
      );

      await agentRepository.updateRun(coverageRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimeCoverage,
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_completed',
        actor_type: 'AI_AGENT',
        actor: 'coverage_agent',
        status: 'COMPLETED',
        message: `Coverage evaluated: ${coverageResult.status} (confidence: ${(coverageResult.confidence * 100).toFixed(0)}%)`,
        metadata: { status: coverageResult.status, reason: coverageResult.reason },
      });

      // --- STEP 4: ANOMALY AGENT ---
      const anomalyRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'ANOMALY',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'anomaly_agent',
        status: 'RUNNING',
        message: 'Anomaly Agent cross-checking documentation for potential inconsistencies',
      });

      const startTimeAnomaly = Date.now();
      const anomalyResult = await anomalyAgent.detectAnomalies(
        claim,
        documentResults,
        currentEvidence,
        anomalyRun.id
      );

      await agentRepository.updateRun(anomalyRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimeAnomaly,
      });

      if (anomalyResult.inconsistenciesFound) {
        await eventRepository.create({
          claim_id: claimId,
          type: 'anomaly_detected',
          actor_type: 'AI_AGENT',
          actor: 'anomaly_agent',
          status: 'WARNING',
          message: `Anomaly Agent detected ${anomalyResult.findings.length} potential inconsistency/inconsistencies`,
          metadata: { count: anomalyResult.findings.length },
        });
      }

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_completed',
        actor_type: 'AI_AGENT',
        actor: 'anomaly_agent',
        status: 'COMPLETED',
        message: `Anomaly Agent analysis concluded: ${anomalyResult.summary}`,
      });

      // --- STEP 5: MISSING INFORMATION AGENT ---
      const missingRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'MISSING_INFO',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'missing_info_agent',
        status: 'RUNNING',
        message: 'Missing Information Agent validating required documentation checklist',
      });

      const startTimeMissing = Date.now();
      const missingInfoResult = await missingInformationAgent.evaluateMissingInformation(
        claim,
        documents,
        documentResults,
        currentEvidence,
        missingRun.id
      );

      await agentRepository.updateRun(missingRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimeMissing,
      });

      if (missingInfoResult.hasMissingInfo) {
        await eventRepository.create({
          claim_id: claimId,
          type: 'missing_information_detected',
          actor_type: 'AI_AGENT',
          actor: 'missing_info_agent',
          status: 'WARNING',
          message: `Identified ${missingInfoResult.missingItems.length} required item(s) missing`,
        });
      }

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_completed',
        actor_type: 'AI_AGENT',
        actor: 'missing_info_agent',
        status: 'COMPLETED',
        message: `Missing Information check completed: ${missingInfoResult.summary}`,
      });

      // --- STEP 6: ASSESSMENT AGENT ---
      const allEvidence = await evidenceRepository.findByClaimId(claimId);
      const allEvidenceIds = allEvidence.map((e) => e.id);

      const assessmentRun = await agentRepository.createRun({
        claim_id: claimId,
        agent_type: 'ASSESSMENT',
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'agent_started',
        actor_type: 'AI_AGENT',
        actor: 'assessment_agent',
        status: 'RUNNING',
        message: 'Assessment Agent synthesizing intelligence across all specialist agents',
      });

      const startTimeAssessment = Date.now();
      const assessment = await assessmentAgent.produceAssessment(
        claim,
        coverageResult,
        anomalyResult,
        missingInfoResult,
        allEvidenceIds,
        assessmentRun.id
      );

      await agentRepository.updateRun(assessmentRun.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTimeAssessment,
      });

      await eventRepository.create({
        claim_id: claimId,
        type: 'assessment_completed',
        actor_type: 'AI_AGENT',
        actor: 'assessment_agent',
        status: 'COMPLETED',
        message: `Assessment completed. Recommendation: ${assessment.recommendation.toUpperCase()} (Complexity: ${assessment.complexity})`,
        metadata: {
          recommendation: assessment.recommendation,
          complexity: assessment.complexity,
          evidenceCount: allEvidenceIds.length,
        },
      });

      if (assessment.recommendation === 'human_review') {
        await eventRepository.create({
          claim_id: claimId,
          type: 'human_review_required',
          actor_type: 'AI_AGENT',
          actor: 'assessment_agent',
          status: 'FLAGGED',
          message: 'Claim flagged for human claims officer review before settlement',
        });
      }

      // Audit Log
      await auditRepository.create({
        actor_type: 'AI_AGENT',
        actor_id: null,
        action: 'INVESTIGATION_COMPLETED',
        entity_type: 'claims',
        entity_id: claimId,
        metadata: {
          recommendation: assessment.recommendation,
          complexity: assessment.complexity,
          coverage: coverageResult.status,
          evidenceIdsCount: allEvidenceIds.length,
        },
      });

      // Updated claim
      const updatedClaim = (await claimRepository.findById(claimId)) || claim;

      // Dispatched notifications (asynchronously decoupled)
      if (missingInfoResult.hasMissingInfo) {
        emailService
          .sendMissingInfoNotification(
            updatedClaim,
            missingInfoResult.missingItems.map((m) => m.required_item)
          )
          .catch((err) => logger.warn('Failed to send missing info email', { error: err.message }));
      } else if (assessment.recommendation === 'human_review') {
        emailService
          .sendHumanReviewNotification(
            updatedClaim,
            assessment.reasons.join(', ') || 'Complexity evaluation threshold'
          )
          .catch((err) => logger.warn('Failed to send human review email', { error: err.message }));
      } else {
        emailService
          .sendInvestigationCompleteNotification(
            updatedClaim,
            `Coverage verified as ${coverageResult.status}. Eligible for automated settlement processing.`
          )
          .catch((err) => logger.warn('Failed to send investigation complete email', { error: err.message }));
      }

      return {
        claimId,
        claimNumber: claim.claim_number,
        status: updatedClaim.status,
        documentResults,
        policyResults,
        coverageResult,
        anomalyResult,
        missingInfoResult,
        assessment,
        totalEvidenceCount: allEvidenceIds.length,
      };
    } catch (err: any) {
      logger.error(`Investigation pipeline failed on claim ${claimId}`, { error: err.message });

      await eventRepository.create({
        claim_id: claimId,
        type: 'investigation_failed',
        actor_type: 'AI_AGENT',
        actor: 'orchestrator',
        status: 'FAILED',
        message: `Investigation pipeline halted: ${err.message}`,
      });

      await auditRepository.create({
        actor_type: 'AI_AGENT',
        actor_id: null,
        action: 'INVESTIGATION_FAILED',
        entity_type: 'claims',
        entity_id: claimId,
        metadata: { error: err.message },
      });

      throw new AgentError(`Investigation failed: ${err.message}`, { claimId });
    }
  },

  async getInvestigationSummary(claimId: string): Promise<any> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) throw new NotFoundError('Claim not found');

    const runs = await agentRepository.getRunsByClaimId(claimId);
    const findings = await agentRepository.getFindingsByClaimId(claimId);
    const missingInfo = await missingInformationAgent.createFallbackAnalysis(
      claim,
      await documentRepository.findByClaimId(claimId)
    );
    const assessment = await claimRepository.findById(claimId);

    return {
      claimId,
      status: claim.status,
      complexity: claim.complexity,
      requires_human_review: claim.requires_human_review,
      agentRuns: runs,
      findings,
      missingInfo: missingInfo.missing_items,
      assessment,
    };
  },
};
