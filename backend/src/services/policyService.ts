import { userPolicyRepository, policyRepository, auditRepository, profileRepository } from '../repositories/index.js';
import { storageService } from '../document-processing/storageService.js';
import { policyDocumentAgent, PolicyExtractionResult } from '../agents/policyDocumentAgent.js';
import { SavePolicyInput, UpdatePolicyInput, UpdatePricingInput } from '../schemas/policy.js';
import { UserPolicy, UserRole } from '../types/database.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';
import { inMemoryStore } from '../repositories/inMemoryStore.js';
import { randomUUID } from 'crypto';

export const policyService = {
  async uploadAndAnalyze(
    userId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number }
  ): Promise<{
    analysis: PolicyExtractionResult;
    storagePath: string;
    fileName: string;
  }> {
    logger.info(`Analyzing uploaded policy document: ${file.originalname} for user ${userId}`);

    // Upload to storage under user policies folder
    const storagePath = await storageService.uploadFile(
      `policies_${userId}`,
      file.originalname,
      file.buffer,
      file.mimetype
    );

    // Run Policy Document Agent (Agent 1)
    const analysis = await policyDocumentAgent.extractPolicy(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: userId,
      action: 'POLICY_DOCUMENT_ANALYZED',
      entity_type: 'policies',
      metadata: { fileName: file.originalname, policy_number: analysis.policy_number },
    });

    return {
      analysis,
      storagePath,
      fileName: file.originalname,
    };
  },

  async confirmAndSavePolicy(userId: string, input: SavePolicyInput): Promise<UserPolicy> {
    logger.info(`Confirming and saving policy ${input.policy_number} for user ${userId}`);

    const policy = await userPolicyRepository.create({
      user_id: userId,
      policy_number: input.policy_number,
      insurer_name: input.insurer_name,
      policy_name: input.policy_name,
      policy_type: input.policy_type,
      policyholder_name: input.policyholder_name,
      insured_asset: input.insured_asset || null,
      start_date: input.start_date,
      expiry_date: input.expiry_date,
      premium: input.premium,
      deductible: input.deductible,
      coverage: input.coverage,
      exclusions: input.exclusions,
      limits: input.limits,
      status: input.status,
      document_id: input.document_id || null,
      extracted_metadata: input.extracted_metadata || null,
      evidence: input.evidence || null,
    });

    // Also index into policy_documents & policy_chunks for RAG claim retrieval
    const ragDocId = randomUUID();
    const rawContent = `Policy: ${input.policy_name} (${input.policy_number}) by ${input.insurer_name}.
Coverage: ${input.coverage.join('. ')}.
Exclusions: ${input.exclusions.join('. ')}.
Limits: ${input.limits.join('. ')}.
Deductible: $${input.deductible}. Premium: $${input.premium}.`;

    const policyDoc = {
      id: ragDocId,
      policy_number: input.policy_number,
      title: input.policy_name,
      policy_type: input.policy_type,
      effective_from: input.start_date,
      effective_to: input.expiry_date,
      raw_content: rawContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryStore.policyDocuments.set(policyDoc.id, policyDoc);

    // Add chunks
    input.coverage.forEach((cov, idx) => {
      const chunkId = randomUUID();
      inMemoryStore.policyChunks.set(chunkId, {
        id: chunkId,
        policy_document_id: ragDocId,
        section_title: `Coverage Clause ${idx + 1}`,
        page_number: 1,
        chunk_text: `${cov}. Limit applies under policy ${input.policy_number}. Standard deductible is $${input.deductible}.`,
        chunk_index: idx,
        created_at: new Date().toISOString(),
      });
    });

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: userId,
      action: 'POLICY_SAVED',
      entity_type: 'user_policies',
      entity_id: policy.id,
      metadata: { policy_number: policy.policy_number, premium: policy.premium },
    });

    // Decoupled notification email
    const profile = await profileRepository.findById(userId);
    if (profile?.email) {
      emailService
        .sendEmail({
          to: profile.email,
          template: 'policy-analysed',
          data: {
            recipientName: profile.full_name || 'Policyholder',
            claimNumber: policy.policy_number,
            claimTitle: policy.policy_name,
            claimAmount: policy.premium,
            status: 'ACTIVE',
            reason: `Your policy ${policy.policy_name} has been verified and registered.`,
          },
        })
        .catch((err) => logger.warn('Failed to send policy email', { error: err.message }));
    }

    return policy;
  },

  async listUserPolicies(userId: string): Promise<UserPolicy[]> {
    return userPolicyRepository.findByUserId(userId);
  },

  async getPolicyById(userId: string, role: UserRole, policyId: string): Promise<UserPolicy> {
    const policy = await userPolicyRepository.findById(policyId);
    if (!policy) throw new NotFoundError(`Policy with ID ${policyId} not found`);

    if (role !== 'ADMIN' && role !== 'CLAIMS_OFFICER' && policy.user_id !== userId) {
      throw new AuthorizationError('You do not have permission to view this policy');
    }

    return policy;
  },

  async updatePolicy(
    userId: string,
    role: UserRole,
    policyId: string,
    updates: UpdatePolicyInput
  ): Promise<UserPolicy> {
    const existing = await this.getPolicyById(userId, role, policyId);

    const updated = await userPolicyRepository.update(existing.id, updates);
    if (!updated) throw new NotFoundError('Policy not found');

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: userId,
      action: 'POLICY_UPDATED',
      entity_type: 'user_policies',
      entity_id: policyId,
      metadata: updates,
    });

    return updated;
  },

  async updatePricing(
    adminId: string,
    policyId: string,
    pricingUpdates: UpdatePricingInput
  ): Promise<UserPolicy> {
    const policy = await userPolicyRepository.findById(policyId);
    if (!policy) throw new NotFoundError(`Policy ${policyId} not found`);

    const updated = await userPolicyRepository.update(policyId, {
      premium: pricingUpdates.premium !== undefined ? pricingUpdates.premium : policy.premium,
      deductible: pricingUpdates.deductible !== undefined ? pricingUpdates.deductible : policy.deductible,
      limits: pricingUpdates.limits || policy.limits,
      coverage: pricingUpdates.coverage || policy.coverage,
    });

    await auditRepository.create({
      actor_type: 'USER',
      actor_id: adminId,
      action: 'POLICY_PRICING_UPDATED_BY_ADMIN',
      entity_type: 'user_policies',
      entity_id: policyId,
      metadata: pricingUpdates,
    });

    return updated!;
  },
};
