import { z } from 'zod';
import { Claim, AgentFinding, Evidence, FindingSeverity } from '../types/database.js';
import { DocumentAgentOutput } from './documentAgent.js';
import { geminiService } from '../services/geminiService.js';
import { agentRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

export const anomalyItemSchema = z.object({
  category: z.enum([
    'DATE_MISMATCH',
    'AMOUNT_MISMATCH',
    'IDENTITY_MISMATCH',
    'POLICY_NUMBER_MISMATCH',
    'CONTRADICTORY_DESCRIPTION',
    'TIMELINE_DISCREPANCY',
    'OTHER_DISCREPANCY',
  ]),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  referenced_texts: z.array(z.string()).default([]),
});

export const anomalyAnalysisSchema = z.object({
  inconsistencies_found: z.boolean(),
  analysis_summary: z.string(),
  anomalies: z.array(anomalyItemSchema).default([]),
});

export type AnomalyAnalysis = z.infer<typeof anomalyAnalysisSchema>;

export interface AnomalyAgentOutput {
  inconsistenciesFound: boolean;
  summary: string;
  findings: AgentFinding[];
  evidenceIds: string[];
}

export const anomalyAgent = {
  async detectAnomalies(
    claim: Claim,
    extractedDocs: DocumentAgentOutput[],
    documentEvidence: Evidence[],
    agentRunId?: string
  ): Promise<AnomalyAgentOutput> {
    logger.info(`AnomalyAgent evaluating claim ${claim.id} across ${extractedDocs.length} documents`);

    let analysis: AnomalyAnalysis;
    const allEvidenceIds = documentEvidence.map((e) => e.id);

    if (geminiService.isConfigured() && extractedDocs.length > 0) {
      try {
        const docSummaries = extractedDocs
          .map((d, i) => {
            const ext = d.extracted;
            return `Document ${i + 1} (${d.documentType}):
- Extracted Policy: ${ext.policy_number || 'N/A'}
- Extracted Date: ${ext.incident_date || 'N/A'}
- Extracted Amount: ${ext.amount !== undefined && ext.amount !== null ? `$${ext.amount}` : 'N/A'}
- Parties: ${ext.parties_involved.join(', ') || 'N/A'}
- Incident Summary: ${ext.incident_summary || 'N/A'}
- Quotes: ${ext.extracted_fields.map((f) => `"${f.field}: ${f.source_text}"`).join(' | ')}`;
          })
          .join('\n\n');

        const prompt = `You are a forensic Insurance Claim Anomaly and Inconsistency Detection AI Agent.
Review the submitted claim details and cross-examine them against the extracted documents.

Claim Submission:
- Claim Number: ${claim.claim_number}
- Policy Number: ${claim.policy_number}
- Claim Amount: $${claim.claim_amount}
- Incident Date: ${claim.incident_date}
- Title: ${claim.title}
- Description: ${claim.description}

Extracted Documents:
${docSummaries}

Critical Instructions:
1. Identify any potential inconsistencies: date mismatches, monetary amount mismatches, identity/party discrepancies, policy number mismatches, or contradictory timelines.
2. DO NOT automatically label any finding as fraud. Use strictly objective terms: "Potential Inconsistency", "Anomaly", "Requires Verification".
3. Assign severity: LOW (minor typographic or non-material variation), MEDIUM (unexplained date/amount variance requiring clarification), HIGH (direct contradiction between documents), CRITICAL (severe factual discrepancy).
4. If everything is consistent and corroborated, set inconsistencies_found to false and anomalies to empty array.
5. Reference exact quoted phrases from documents in referenced_texts.`;

        analysis = await geminiService.generateStructured(
          prompt,
          anomalyAnalysisSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini anomaly detection error or fallback: ${err.message}`);
        analysis = this.createFallbackAnalysis(claim, extractedDocs);
      }
    } else {
      analysis = this.createFallbackAnalysis(claim, extractedDocs);
    }

    const createdFindings: AgentFinding[] = [];

    // Persist each anomaly as an AgentFinding with evidence IDs
    for (const item of analysis.anomalies) {
      // Find matching evidence IDs by quote or attach all available doc evidence
      const matchedEvidenceIds = documentEvidence
        .filter((e) => item.referenced_texts.some((t) => e.source_text.includes(t) || t.includes(e.source_text)))
        .map((e) => e.id);

      const finalEvidenceIds = matchedEvidenceIds.length > 0 ? matchedEvidenceIds : allEvidenceIds;

      const finding = await agentRepository.createFinding({
        claim_id: claim.id,
        agent_run_id: agentRunId || null,
        finding_type: `ANOMALY_${item.category}`,
        title: item.title,
        description: item.description,
        severity: item.severity as FindingSeverity,
        evidence_ids: finalEvidenceIds,
        metadata: {
          category: item.category,
          referenced_texts: item.referenced_texts,
        },
      });

      createdFindings.push(finding);
    }

    return {
      inconsistenciesFound: analysis.inconsistencies_found,
      summary: analysis.analysis_summary,
      findings: createdFindings,
      evidenceIds: allEvidenceIds,
    };
  },

  createFallbackAnalysis(
    claim: Claim,
    extractedDocs: DocumentAgentOutput[]
  ): AnomalyAnalysis {
    const anomalies: z.infer<typeof anomalyItemSchema>[] = [];

    for (const doc of extractedDocs) {
      const ext = doc.extracted;

      // 1. Policy Number check
      if (ext.policy_number && ext.policy_number !== claim.policy_number) {
        anomalies.push({
          category: 'POLICY_NUMBER_MISMATCH',
          title: 'Potential Inconsistency: Policy Number Variation',
          description: `Document "${doc.documentType}" cites policy number "${ext.policy_number}", differing from registered claim policy "${claim.policy_number}". Requires Verification.`,
          severity: 'HIGH',
          referenced_texts: [`Policy Reference: ${ext.policy_number}`],
        });
      }

      // 2. Incident Date check
      if (ext.incident_date && ext.incident_date !== claim.incident_date) {
        anomalies.push({
          category: 'DATE_MISMATCH',
          title: 'Potential Inconsistency: Incident Date Discrepancy',
          description: `Document states loss date as "${ext.incident_date}", whereas claim form states "${claim.incident_date}". Requires Verification.`,
          severity: 'MEDIUM',
          referenced_texts: [`Loss Date: ${ext.incident_date}`],
        });
      }

      // 3. Amount Variance check (>20% difference)
      if (ext.amount !== undefined && ext.amount !== null && ext.amount > 0) {
        const diff = Math.abs(claim.claim_amount - ext.amount);
        if (diff > claim.claim_amount * 0.25) {
          anomalies.push({
            category: 'AMOUNT_MISMATCH',
            title: 'Potential Inconsistency: Claim Amount Variance',
            description: `Document monetary figure ($${ext.amount}) varies from claimed total ($${claim.claim_amount}) by over 25%. Requires Verification.`,
            severity: 'MEDIUM',
            referenced_texts: [`Amount: $${ext.amount}`],
          });
        }
      }
    }

    return {
      inconsistencies_found: anomalies.length > 0,
      analysis_summary:
        anomalies.length > 0
          ? `Identified ${anomalies.length} potential inconsistencies across submitted documents requiring verification.`
          : 'No significant anomalies or inconsistencies detected across submitted claim documentation.',
      anomalies,
    };
  },
};
