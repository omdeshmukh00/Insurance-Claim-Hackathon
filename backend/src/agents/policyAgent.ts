import { Claim, PolicyDocument, PolicyChunk, Evidence } from '../types/database.js';
import { policyRepository, evidenceRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import { AgentError } from '../utils/errors.js';

export interface RetrievedPolicyClause {
  documentId: string;
  policyNumber: string;
  section: string;
  page: number;
  text: string;
  relevanceScore: number;
  evidenceId: string;
}

export interface PolicyAgentOutput {
  policy: PolicyDocument | null;
  clauses: RetrievedPolicyClause[];
  evidenceIds: string[];
}

export const policyAgent = {
  async retrievePolicyClauses(claim: Claim, agentRunId?: string): Promise<PolicyAgentOutput> {
    logger.info(`PolicyAgent retrieving clauses for claim ${claim.id} (policy: ${claim.policy_number})`);

    // 1. Fetch policy document
    let policy = await policyRepository.findPolicyByNumber(claim.policy_number);
    if (!policy) {
      // Check fallback policy by type
      logger.warn(`Specific policy ${claim.policy_number} not found. Attempting type-based retrieval.`);
    }

    // 2. Perform retrieval query based on claim description, title, and claim type
    const query = `${claim.claim_type} ${claim.title} ${claim.description}`;
    const chunks: PolicyChunk[] = await policyRepository.searchPolicyChunks(
      claim.policy_number,
      query
    );

    if (chunks.length === 0) {
      logger.warn(`No specific policy chunks retrieved for policy ${claim.policy_number}`);
    }

    const clauses: RetrievedPolicyClause[] = [];
    const evidenceIds: string[] = [];

    // 3. Persist evidence for each retrieved policy clause
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const relevanceScore = Math.max(0.5, 1 - i * 0.1);

      const evidence = await evidenceRepository.create({
        claim_id: claim.id,
        agent_run_id: agentRunId || null,
        document_id: null, // policy chunk evidence
        page_number: chunk.page_number || 1,
        source_text: `[${chunk.section_title}] ${chunk.chunk_text}`,
        evidence_type: 'POLICY_CLAUSE',
        metadata: {
          policy_document_id: chunk.policy_document_id,
          policy_number: claim.policy_number,
          section_title: chunk.section_title,
          relevance_score: relevanceScore,
        },
      });

      clauses.push({
        documentId: chunk.policy_document_id,
        policyNumber: claim.policy_number,
        section: chunk.section_title,
        page: chunk.page_number || 1,
        text: chunk.chunk_text,
        relevanceScore,
        evidenceId: evidence.id,
      });
      evidenceIds.push(evidence.id);
    }

    return {
      policy,
      clauses,
      evidenceIds,
    };
  },
};
