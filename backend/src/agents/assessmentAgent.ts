import { z } from 'zod';
import {
  Claim,
  Assessment,
  ClaimComplexity,
  CoverageStatus,
} from '../types/database.js';
import { CoverageAgentOutput } from './coverageAgent.js';
import { AnomalyAgentOutput } from './anomalyAgent.js';
import { MissingInfoAgentOutput } from './missingInformationAgent.js';
import { geminiService } from '../services/geminiService.js';
import { assessmentRepository, claimRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

export const assessmentSchema = z.object({
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  recommendation: z.enum(['automated_processing', 'human_review']),
  reasons: z.array(z.string()).min(1),
  coverage_summary: z.string(),
  anomaly_summary: z.string(),
  missing_info_summary: z.string(),
});

export type AssessmentResult = z.infer<typeof assessmentSchema>;

export const assessmentAgent = {
  async produceAssessment(
    claim: Claim,
    coverage: CoverageAgentOutput,
    anomalies: AnomalyAgentOutput,
    missingInfo: MissingInfoAgentOutput,
    evidenceIds: string[],
    _agentRunId?: string
  ): Promise<Assessment> {
    logger.info(`AssessmentAgent synthesizing comprehensive assessment for claim ${claim.id}`);

    let assessmentResult: AssessmentResult;

    if (geminiService.isConfigured()) {
      try {
        const prompt = `You are the Lead Claim Intelligence Assessment AI Agent.
Synthesize the multi-agent findings for this claim and produce a conclusive, evidence-backed assessment.

Claim Information:
- Number: ${claim.claim_number}
- Type: ${claim.claim_type}
- Amount: $${claim.claim_amount}
- Incident Date: ${claim.incident_date}
- Description: ${claim.description}

Agent Evaluations:
1. Coverage Status: ${coverage.status}
   Reason: ${coverage.reason} (Confidence: ${coverage.confidence})

2. Anomalies / Inconsistencies:
   Summary: ${anomalies.summary}
   Count: ${anomalies.findings.length}
   Details: ${anomalies.findings.map((f) => `[${f.severity}] ${f.title}: ${f.description}`).join('; ') || 'None'}

3. Missing Information:
   Summary: ${missingInfo.summary}
   Count: ${missingInfo.missingItems.length}
   Details: ${missingInfo.missingItems.map((m) => `[${m.priority}] ${m.required_item}: ${m.reason}`).join('; ') || 'None'}

Decision Rules:
- If coverage is not clearly verified, or any HIGH/CRITICAL anomalies exist, or vital documents are missing, or amount > $10,000: recommendation MUST BE 'human_review'.
- If coverage is COVERED, no significant anomalies exist, documentation is complete, and amount <= $10,000: recommendation may be 'automated_processing'.
- Complexity should be LOW for straightforward claims with clean evidence, MEDIUM for minor clarifications, and HIGH for major discrepancies or high values.
- Never settle the claim; strictly recommend next pipeline stage.`;

        assessmentResult = await geminiService.generateStructured(
          prompt,
          assessmentSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini assessment synthesis error: ${err.message}. Using deterministic logic.`);
        assessmentResult = this.createFallbackAssessment(claim, coverage, anomalies, missingInfo);
      }
    } else {
      assessmentResult = this.createFallbackAssessment(claim, coverage, anomalies, missingInfo);
    }

    // Persist assessment record
    const savedAssessment = await assessmentRepository.create({
      claim_id: claim.id,
      complexity: assessmentResult.complexity as ClaimComplexity,
      coverage_status: coverage.status as CoverageStatus,
      coverage_summary: assessmentResult.coverage_summary,
      anomaly_summary: assessmentResult.anomaly_summary,
      missing_info_summary: assessmentResult.missing_info_summary,
      recommendation: assessmentResult.recommendation,
      reasons: assessmentResult.reasons,
      evidence_ids: evidenceIds,
      metadata: {
        coverageConfidence: coverage.confidence,
        anomalyCount: anomalies.findings.length,
        missingItemsCount: missingInfo.missingItems.length,
      },
    });

    // Update claim with complexity and human review requirement flag
    await claimRepository.update(claim.id, {
      complexity: assessmentResult.complexity as ClaimComplexity,
      requires_human_review: assessmentResult.recommendation === 'human_review',
      status:
        missingInfo.missingItems.length > 0
          ? 'REQUIRES_INFO'
          : assessmentResult.recommendation === 'human_review'
          ? 'UNDER_REVIEW'
          : 'PROCESSING',
    });

    return savedAssessment;
  },

  createFallbackAssessment(
    claim: Claim,
    coverage: CoverageAgentOutput,
    anomalies: AnomalyAgentOutput,
    missingInfo: MissingInfoAgentOutput
  ): AssessmentResult {
    const reasons: string[] = [];
    let requiresHumanReview = false;
    let complexity: ClaimComplexity = 'LOW';

    // 1. Coverage check
    if (coverage.status !== 'COVERED') {
      requiresHumanReview = true;
      reasons.push(`Coverage status is ${coverage.status}: ${coverage.reason}`);
      complexity = 'MEDIUM';
    } else {
      reasons.push(`Policy coverage confirmed: ${coverage.reason}`);
    }

    // 2. Anomaly check
    const highAnomalies = anomalies.findings.filter(
      (f) => f.severity === 'HIGH' || f.severity === 'CRITICAL'
    );
    if (highAnomalies.length > 0) {
      requiresHumanReview = true;
      complexity = 'HIGH';
      reasons.push(`Detected ${highAnomalies.length} high-severity anomaly requiring verification.`);
    } else if (anomalies.findings.length > 0) {
      reasons.push(`Minor inconsistencies detected (${anomalies.findings.length}) requiring verification.`);
    }

    // 3. Missing info check
    if (missingInfo.missingItems.length > 0) {
      requiresHumanReview = true;
      reasons.push(`Missing ${missingInfo.missingItems.length} required documentation item(s).`);
    }

    // 4. Threshold check
    if (claim.claim_amount > 10000) {
      requiresHumanReview = true;
      complexity = 'HIGH';
      reasons.push('Claim amount exceeds $10,000 automated threshold, requiring officer approval.');
    }

    return {
      complexity,
      recommendation: requiresHumanReview ? 'human_review' : 'automated_processing',
      reasons,
      coverage_summary: coverage.reason,
      anomaly_summary: anomalies.summary,
      missing_info_summary: missingInfo.summary,
    };
  },
};
