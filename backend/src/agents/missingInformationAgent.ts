import { z } from 'zod';
import { Claim, ClaimDocument, MissingInformation, FindingSeverity, Evidence } from '../types/database.js';
import { DocumentAgentOutput } from './documentAgent.js';
import { geminiService } from '../services/geminiService.js';
import { missingInfoRepository, agentRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

export const missingItemSchema = z.object({
  required_item: z.string(),
  reason: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  context: z.string(),
});

export const missingInfoAnalysisSchema = z.object({
  has_missing_info: z.boolean(),
  summary: z.string(),
  missing_items: z.array(missingItemSchema).default([]),
});

export type MissingInfoAnalysis = z.infer<typeof missingInfoAnalysisSchema>;

export interface MissingInfoAgentOutput {
  hasMissingInfo: boolean;
  summary: string;
  missingItems: MissingInformation[];
  evidenceIds: string[];
}

export const missingInformationAgent = {
  async evaluateMissingInformation(
    claim: Claim,
    documents: ClaimDocument[],
    extractedDocs: DocumentAgentOutput[],
    availableEvidence: Evidence[],
    agentRunId?: string
  ): Promise<MissingInfoAgentOutput> {
    logger.info(`MissingInformationAgent inspecting claim ${claim.id} with ${documents.length} documents`);

    let analysis: MissingInfoAnalysis;
    const evidenceIds = availableEvidence.map((e) => e.id);

    if (geminiService.isConfigured()) {
      try {
        const docTypesPresent = documents
          .map((d) => `- ${d.file_name} (Type: ${d.document_type})`)
          .join('\n');

        const prompt = `You are a compliance Insurance Claim Intake & Requirements AI Agent.
Analyze whether the submitted claim has all necessary documentation and information for a conclusive, evidence-backed assessment.

Claim Submission:
- Claim Number: ${claim.claim_number}
- Claim Type: ${claim.claim_type}
- Claim Amount: $${claim.claim_amount}
- Incident Date: ${claim.incident_date}
- Description: ${claim.description}

Currently Attached Documents:
${docTypesPresent || 'None'}

Requirements Guideline:
- AUTO claims typically require: Incident/Police Report (if collision/theft), Repair Estimate or Shop Invoice, and Photos of damage.
- PROPERTY claims typically require: Proof of Loss, Itemized Repair/Contractor Quote, and Damage Photos.
- HEALTH claims typically require: Medical Invoice/Receipts and Diagnosis Report.
- Claims > $3,000 should have itemized damage/repair estimates.

Instructions:
1. Determine if any essential documentation or factual verification is missing.
2. If missing, list each required_item, specific reason, priority (LOW, MEDIUM, HIGH, CRITICAL), and context.
3. If all necessary documentation is present for a fair assessment, set has_missing_info to false.`;

        analysis = await geminiService.generateStructured(
          prompt,
          missingInfoAnalysisSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini missing info analysis error or fallback: ${err.message}`);
        analysis = this.createFallbackAnalysis(claim, documents);
      }
    } else {
      analysis = this.createFallbackAnalysis(claim, documents);
    }

    const createdMissingRecords: MissingInformation[] = [];

    // Persist records into missing_information and agent_findings
    for (const item of analysis.missing_items) {
      const record = await missingInfoRepository.create({
        claim_id: claim.id,
        required_item: item.required_item,
        reason: item.reason,
        priority: item.priority as FindingSeverity,
        status: 'REQUESTED',
        context_evidence_ids: evidenceIds,
      });

      createdMissingRecords.push(record);

      await agentRepository.createFinding({
        claim_id: claim.id,
        agent_run_id: agentRunId || null,
        finding_type: 'MISSING_INFORMATION',
        title: `Required Documentation: ${item.required_item}`,
        description: item.reason,
        severity: item.priority as FindingSeverity,
        evidence_ids: evidenceIds,
        metadata: {
          missing_info_id: record.id,
          priority: item.priority,
        },
      });
    }

    return {
      hasMissingInfo: analysis.has_missing_info,
      summary: analysis.summary,
      missingItems: createdMissingRecords,
      evidenceIds,
    };
  },

  createFallbackAnalysis(claim: Claim, documents: ClaimDocument[]): MissingInfoAnalysis {
    const missing: z.infer<typeof missingItemSchema>[] = [];
    const docTypes = documents.map((d) => (d.document_type || '').toUpperCase());

    if (claim.claim_type === 'AUTO') {
      const hasPoliceReport = docTypes.some((t) => t.includes('POLICE') || t.includes('INCIDENT'));
      const hasEstimate = docTypes.some((t) => t.includes('REPAIR') || t.includes('ESTIMATE') || t.includes('INVOICE'));

      if (!hasEstimate && claim.claim_amount > 1000) {
        missing.push({
          required_item: 'Itemized Repair Estimate or Invoice',
          reason: 'Auto damage claim exceeds $1,000 but lacks an itemized repair estimate from a licensed body shop.',
          priority: 'HIGH',
          context: 'Necessary to substantiate loss valuation and repair labor costs.',
        });
      }

      if (!hasPoliceReport && claim.claim_amount > 5000) {
        missing.push({
          required_item: 'Official Police / Incident Report',
          reason: 'Severe auto collision claim requires formal police incident report within 48 hours for third-party liability verification.',
          priority: 'MEDIUM',
          context: 'Policy requires accident report corroboration for claims over $5,000.',
        });
      }
    } else if (claim.claim_type === 'PROPERTY') {
      const hasPhotos = docTypes.some((t) => t.includes('PHOTO') || t.includes('DAMAGE'));
      if (!hasPhotos) {
        missing.push({
          required_item: 'Photographic Proof of Property Damage',
          reason: 'Property loss claims require photographic evidence of damaged areas.',
          priority: 'MEDIUM',
          context: 'Required to substantiate physical loss to dwelling or contents.',
        });
      }
    }

    return {
      has_missing_info: missing.length > 0,
      summary:
        missing.length > 0
          ? `Identified ${missing.length} missing documentation item(s) needed for final assessment.`
          : 'All essential claim verification documents are present.',
      missing_items: missing,
    };
  },
};
