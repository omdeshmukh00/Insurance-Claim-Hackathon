import { z } from 'zod';
import { Claim, CoverageStatus, Evidence } from '../types/database.js';
import { RetrievedPolicyClause } from './policyAgent.js';
import { geminiService } from '../services/geminiService.js';
import { agentRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

export const coverageAssessmentSchema = z.object({
  status: z.enum([
    'COVERED',
    'POTENTIALLY_COVERED',
    'NOT_CLEARLY_COVERED',
    'NOT_COVERED',
    'REQUIRES_REVIEW',
  ]),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  applicable_clause_sections: z.array(z.string()).default([]),
});

export type CoverageAssessment = z.infer<typeof coverageAssessmentSchema>;

export interface CoverageAgentOutput {
  status: CoverageStatus;
  reason: string;
  confidence: number;
  evidenceIds: string[];
  findingId: string;
}

export const coverageAgent = {
  async evaluateCoverage(
    claim: Claim,
    policyClauses: RetrievedPolicyClause[],
    documentEvidence: Evidence[],
    agentRunId?: string
  ): Promise<CoverageAgentOutput> {
    logger.info(`CoverageAgent evaluating coverage for claim ${claim.id}`);

    let assessment: CoverageAssessment;
    const availableEvidenceIds = [
      ...policyClauses.map((c) => c.evidenceId),
      ...documentEvidence.map((e) => e.id),
    ];

    if (geminiService.isConfigured() && policyClauses.length > 0) {
      try {
        const clausesText = policyClauses
          .map((c, i) => `Clause [${i + 1}] (${c.section}, page ${c.page}):\n"${c.text}"`)
          .join('\n\n');

        const evidenceText = documentEvidence
          .map((e, i) => `Doc Evidence [${i + 1}]: "${e.source_text}"`)
          .join('\n');

        const prompt = `You are a certified Insurance Coverage AI Agent.
Evaluate the following insurance claim strictly against the retrieved policy clauses and document evidence.

Claim Details:
- Claim Number: ${claim.claim_number}
- Policy Number: ${claim.policy_number}
- Claim Type: ${claim.claim_type}
- Claim Title: ${claim.title}
- Claim Description: ${claim.description}
- Claim Amount: $${claim.claim_amount}
- Incident Date: ${claim.incident_date}

Retrieved Policy Clauses:
${clausesText}

Supporting Document Evidence:
${evidenceText || 'None provided yet'}

Instructions:
1. Determine coverage status strictly among: COVERED, POTENTIALLY_COVERED, NOT_CLEARLY_COVERED, NOT_COVERED, REQUIRES_REVIEW.
2. Provide a thorough, objective reason referencing the exact policy clauses.
3. State your confidence score from 0.0 to 1.0.
4. List the exact section titles of the applicable clauses.
5. NEVER fabricate coverage if no retrieved clause supports it.`;

        assessment = await geminiService.generateStructured(
          prompt,
          coverageAssessmentSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini coverage evaluation failed or fallback: ${err.message}`);
        assessment = this.createFallbackAssessment(claim, policyClauses);
      }
    } else {
      assessment = this.createFallbackAssessment(claim, policyClauses);
    }

    // Persist Agent Finding with referenced evidence IDs
    const finding = await agentRepository.createFinding({
      claim_id: claim.id,
      agent_run_id: agentRunId || null,
      finding_type: 'COVERAGE_ASSESSMENT',
      title: `Coverage Status: ${assessment.status}`,
      description: assessment.reason,
      severity:
        assessment.status === 'NOT_COVERED'
          ? 'HIGH'
          : assessment.status === 'REQUIRES_REVIEW'
          ? 'MEDIUM'
          : 'LOW',
      evidence_ids: availableEvidenceIds,
      metadata: {
        confidence: assessment.confidence,
        applicable_clauses: assessment.applicable_clause_sections,
      },
    });

    return {
      status: assessment.status,
      reason: assessment.reason,
      confidence: assessment.confidence,
      evidenceIds: availableEvidenceIds,
      findingId: finding.id,
    };
  },

  createFallbackAssessment(
    claim: Claim,
    policyClauses: RetrievedPolicyClause[]
  ): CoverageAssessment {
    if (policyClauses.length === 0) {
      return {
        status: 'REQUIRES_REVIEW',
        reason: 'No policy clauses retrieved for policy verification. Human officer review required.',
        confidence: 0.5,
        applicable_clause_sections: [],
      };
    }

    const collisionMatch = policyClauses.find((c) =>
      c.section.toLowerCase().includes('collision') || c.text.toLowerCase().includes('collision')
    );

    if (claim.claim_type === 'AUTO' && collisionMatch) {
      return {
        status: 'COVERED',
        reason: `Claim is supported by ${collisionMatch.section}. Direct damage is covered up to limit subject to deductible.`,
        confidence: 0.92,
        applicable_clause_sections: [collisionMatch.section],
      };
    }

    return {
      status: 'POTENTIALLY_COVERED',
      reason: `Claim aligns with general policy coverage for ${claim.claim_type}. Further document corroboration recommended.`,
      confidence: 0.8,
      applicable_clause_sections: policyClauses.map((c) => c.section),
    };
  },
};
