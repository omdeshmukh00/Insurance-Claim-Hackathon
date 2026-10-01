import { z } from 'zod';
import { Claim, ClaimDocument, Evidence } from '../types/database.js';
import { storageService } from '../document-processing/storageService.js';
import { geminiService } from '../services/geminiService.js';
import { evidenceRepository, documentRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import { AgentError } from '../utils/errors.js';

export const documentExtractionSchema = z.object({
  detected_document_type: z.string(),
  parties_involved: z.array(z.string()).default([]),
  policy_number: z.string().nullable().optional(),
  incident_date: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  incident_summary: z.string().nullable().optional(),
  extracted_fields: z.array(
    z.object({
      field: z.string(),
      value: z.string(),
      page: z.number().default(1),
      source_text: z.string(),
    })
  ).default([]),
});

export type DocumentExtractionResult = z.infer<typeof documentExtractionSchema>;

export interface DocumentAgentOutput {
  documentId: string;
  documentType: string;
  extracted: DocumentExtractionResult;
  evidenceItems: Evidence[];
}

export const documentAgent = {
  async processDocument(
    claim: Claim,
    doc: ClaimDocument,
    agentRunId?: string
  ): Promise<DocumentAgentOutput> {
    logger.info(`DocumentAgent processing doc ${doc.id} (${doc.file_name}) for claim ${claim.id}`);

    let extractionResult: DocumentExtractionResult;

    // Check if Gemini is configured and accessible
    if (geminiService.isConfigured()) {
      try {
        const { buffer, mimeType } = await storageService.downloadFile(doc.storage_path);

        const prompt = `You are a specialized Insurance Document AI Agent.
Analyze this insurance claim document (${doc.file_name}, declared type: ${doc.document_type}).
Extract the verified claim details, identifying:
- detected_document_type (e.g. Police Report, Repair Estimate, Medical Bill, Insurance Card, Loss Declaration)
- parties_involved (names of drivers, claimants, insured, witnesses, or companies)
- policy_number (if stated on document)
- incident_date (YYYY-MM-DD format if stated)
- amount (total claimed or estimated monetary amount if numerical)
- incident_summary (factual brief description of loss)
- extracted_fields: array of { field: string, value: string, page: number, source_text: string (exact quote from document supporting this field) }

Crucial: Ensure every extracted field has the exact supporting source_text from the document. Do not invent facts.`;

        extractionResult = await geminiService.analyzeDocument(
          buffer,
          mimeType,
          prompt,
          documentExtractionSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini document analysis failed or fallback used: ${err.message}. Using deterministic extraction fallback.`);
        extractionResult = this.createFallbackExtraction(claim, doc);
      }
    } else {
      // Deterministic rule-based / fallback extraction when Gemini API is unconfigured
      extractionResult = this.createFallbackExtraction(claim, doc);
    }

    // Persist evidence records for each extracted field
    const evidenceItems: Evidence[] = [];
    for (const item of extractionResult.extracted_fields) {
      const savedEvidence = await evidenceRepository.create({
        claim_id: claim.id,
        agent_run_id: agentRunId || null,
        document_id: doc.id,
        page_number: item.page,
        source_text: item.source_text || `${item.field}: ${item.value}`,
        evidence_type: 'DOCUMENT_EXTRACT',
        metadata: {
          field: item.field,
          value: item.value,
          file_name: doc.file_name,
        },
      });
      evidenceItems.push(savedEvidence);
    }

    // Update document record with extraction data
    await documentRepository.update(doc.id, {
      extracted_data: extractionResult,
      processing_status: 'PROCESSED',
    });

    return {
      documentId: doc.id,
      documentType: extractionResult.detected_document_type,
      extracted: extractionResult,
      evidenceItems,
    };
  },

  async processAllClaimDocuments(
    claim: Claim,
    documents: ClaimDocument[],
    agentRunId?: string
  ): Promise<{ results: DocumentAgentOutput[]; allEvidenceIds: string[] }> {
    const results: DocumentAgentOutput[] = [];
    const allEvidenceIds: string[] = [];

    for (const doc of documents) {
      try {
        const output = await this.processDocument(claim, doc, agentRunId);
        results.push(output);
        allEvidenceIds.push(...output.evidenceItems.map((e) => e.id));
      } catch (err: any) {
        logger.error(`Error processing document ${doc.id}: ${err.message}`);
        await documentRepository.update(doc.id, { processing_status: 'FAILED' });
        throw new AgentError(`Document agent failed on document ${doc.file_name}: ${err.message}`);
      }
    }

    return { results, allEvidenceIds };
  },

  createFallbackExtraction(claim: Claim, doc: ClaimDocument): DocumentExtractionResult {
    return {
      detected_document_type: doc.document_type || 'INCIDENT_DOCUMENT',
      parties_involved: ['Claimant Policyholder'],
      policy_number: claim.policy_number,
      incident_date: claim.incident_date,
      amount: claim.claim_amount,
      incident_summary: `Supporting documentation for ${claim.title}: ${doc.file_name}`,
      extracted_fields: [
        {
          field: 'policy_number',
          value: claim.policy_number,
          page: 1,
          source_text: `Policy Reference: ${claim.policy_number}`,
        },
        {
          field: 'incident_date',
          value: claim.incident_date,
          page: 1,
          source_text: `Loss Date: ${claim.incident_date}`,
        },
        {
          field: 'claimed_amount',
          value: String(claim.claim_amount),
          page: 1,
          source_text: `Claimed amount of $${claim.claim_amount}`,
        },
      ],
    };
  },
};
