import { z } from 'zod';
import { userPolicyRepository, claimRepository, missingInfoRepository, evidenceRepository } from '../repositories/index.js';
import { geminiService } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';

export interface AssistantReference {
  type: 'policy' | 'claim' | 'evidence';
  id: string;
  title: string;
  quote?: string;
}

export interface AssistantResponse {
  answer: string;
  references: AssistantReference[];
  suggestedQuestions: string[];
}

export const assistantResponseSchema: z.ZodType<AssistantResponse> = z
  .object({
    answer: z.string().optional(),
    response: z.string().optional(),
    reply: z.string().optional(),
    references: z
      .array(
        z.object({
          type: z.string().default('policy'),
          id: z.string().optional(),
          title: z.string().optional(),
          quote: z.string().optional(),
          policy_id: z.string().optional(),
          policy_name: z.string().optional(),
        }).passthrough()
      )
      .default([]),
    suggestedQuestions: z.array(z.string()).default([]),
    suggested_questions: z.array(z.string()).default([]),
  })
  .transform((val): AssistantResponse => ({
    answer: val.answer || val.response || val.reply || 'No direct answer available.',
    references: val.references.map((r: any): AssistantReference => ({
      type: (['policy', 'claim', 'evidence'].includes(r.type) ? r.type : 'policy') as 'policy' | 'claim' | 'evidence',
      id: r.id || r.policy_id || 'ref-1',
      title: r.title || r.policy_name || 'Policy Reference',
      quote: r.quote || undefined,
    })),
    suggestedQuestions:
      val.suggestedQuestions.length > 0
        ? val.suggestedQuestions
        : val.suggested_questions.length > 0
          ? val.suggested_questions
          : [],
  }));

export const assistantAgent = {
  async processUserQuery(
    userId: string,
    message: string,
    claimId?: string,
    policyId?: string
  ): Promise<AssistantResponse> {
    logger.info(`AssistantAgent handling query for user ${userId}: "${message}"`);

    // 1. Fetch user's actual policies and claims (strict tenant isolation)
    const policies = await userPolicyRepository.findByUserId(userId);
    const claims = await claimRepository.findByClaimantId(userId);

    let focusedClaim = null;
    let missingInfoItems: any[] = [];
    let claimEvidence: any[] = [];

    if (claimId) {
      focusedClaim = claims.find((c) => c.id === claimId);
      if (focusedClaim) {
        missingInfoItems = await missingInfoRepository.findByClaimId(focusedClaim.id);
        claimEvidence = await evidenceRepository.findByClaimId(focusedClaim.id);
      }
    }

    const policiesContext = policies
      .map(
        (p) =>
          `Policy [${p.policy_number}] "${p.policy_name}" (${p.policy_type}):
- Insurer: ${p.insurer_name}
- Status: ${p.status}
- Dates: ${p.start_date} to ${p.expiry_date}
- Premium: $${p.premium} | Deductible: $${p.deductible}
- Covered: ${p.coverage.join('; ')}
- Exclusions: ${p.exclusions.join('; ')}
- Limits: ${p.limits.join('; ')}`
      )
      .join('\n\n');

    const claimsContext = claims
      .map(
        (c) =>
          `Claim [${c.claim_number}] "${c.title}":
- Status: ${c.status}
- Policy: ${c.policy_number}
- Amount: $${c.claim_amount}
- Date: ${c.incident_date}
- Description: ${c.description}
- Human Review Required: ${c.requires_human_review}`
      )
      .join('\n\n');

    const extraContext = focusedClaim
      ? `Focused Claim Details:
- Missing Documents: ${missingInfoItems.map((m) => `${m.required_item} (${m.reason})`).join(', ') || 'None'}
- Verified Evidence Quotes: ${claimEvidence.map((e) => `"${e.source_text}"`).slice(0, 5).join(' | ') || 'None'}`
      : '';

    if (geminiService.isConfigured()) {
      try {
        const prompt = `You are InsuredYou AI Claims Assistant — a context-aware insurance intelligence assistant.
You are assisting an authenticated policyholder with their verified policies and claims.

User's Verified Policies:
${policiesContext || 'No active policies on file.'}

User's Submitted Claims:
${claimsContext || 'No claims submitted.'}

${extraContext}

User Question: "${message}"

CRITICAL INSTRUCTIONS:
1. Answer accurately and specifically using ONLY the user's actual policies, coverage rules, deductibles, and claims above.
2. If the user asks about an event and policy information exists, explain whether it is covered, citing the specific policy number, deductible, and coverage terms.
3. If the user asks about why a claim is under review or what documents are missing, reference the exact claim details.
4. If the required information is NOT in the user's records, explicitly say: "This information could not be verified in your current policy records." Do NOT invent policy limits, clauses, or claim numbers.
5. Populate references array with relevant items cited in your answer.
6. Provide 2-3 helpful, contextual suggested questions.`;

        const response = await geminiService.generateStructured(
          prompt,
          assistantResponseSchema,
          { temperature: 0.1 }
        );

        return response;
      } catch (err: any) {
        logger.warn(`Gemini assistant fallback: ${err.message}`);
        return this.createFallbackResponse(message, policies, claims, focusedClaim, missingInfoItems);
      }
    }

    return this.createFallbackResponse(message, policies, claims, focusedClaim, missingInfoItems);
  },

  createFallbackResponse(
    message: string,
    policies: any[],
    claims: any[],
    focusedClaim: any,
    missingInfo: any[]
  ): AssistantResponse {
    const q = message.toLowerCase();

    // Check deductible
    if (q.includes('deductible')) {
      const autoPolicy = policies.find((p) => p.policy_type === 'AUTO') || policies[0];
      if (autoPolicy) {
        return {
          answer: `Your deductible for policy ${autoPolicy.policy_number} (${autoPolicy.policy_name}) is $${autoPolicy.deductible} per occurrence. This amount is subtracted from eligible approved damages before claim payout disbursement.`,
          references: [
            {
              type: 'policy',
              id: autoPolicy.id,
              title: `${autoPolicy.policy_number} — ${autoPolicy.policy_name}`,
              quote: `Standard collision deductible: $${autoPolicy.deductible}`,
            },
          ],
          suggestedQuestions: [
            'What is covered under this policy?',
            'What is the status of my claim?',
            'What documents do I need to submit?',
          ],
        };
      }
    }

    // Check covered / accident
    if (q.includes('covered') || q.includes('accident') || q.includes('collision')) {
      const autoPolicy = policies.find((p) => p.policy_type === 'AUTO');
      if (autoPolicy) {
        return {
          answer: `Yes, vehicular accident and collision damage is covered under your ${autoPolicy.policy_name} (${autoPolicy.policy_number}) up to ${autoPolicy.limits[0] || '$50,000'}, subject to your $${autoPolicy.deductible} deductible. You must file a claim with an itemized repair estimate.`,
          references: [
            {
              type: 'policy',
              id: autoPolicy.id,
              title: autoPolicy.policy_name,
              quote: autoPolicy.coverage[0],
            },
          ],
          suggestedQuestions: [
            'What documents do I need for this claim?',
            'What is my deductible?',
            'How do I submit a new claim?',
          ],
        };
      }
    }

    // Check missing documents
    if (q.includes('document') || q.includes('need') || q.includes('missing')) {
      if (missingInfo && missingInfo.length > 0) {
        const items = missingInfo.map((m) => `• ${m.required_item}: ${m.reason}`).join('\n');
        return {
          answer: `Your claim currently requires the following documentation before final assessment can proceed:\n${items}`,
          references: [
            {
              type: 'claim',
              id: focusedClaim?.id || 'claim-info',
              title: `Claim Requirements`,
            },
          ],
          suggestedQuestions: [
            'Why is my claim under review?',
            'What is my deductible?',
            'Is my car accident covered?',
          ],
        };
      }
      return {
        answer: 'For a standard auto collision claim, you generally need an itemized repair estimate from a licensed body shop, photos of the vehicular damage, and a police incident report if another vehicle was involved.',
        references: [],
        suggestedQuestions: [
          'What is my deductible?',
          'Show me my active policies',
          'What is the status of my claim?',
        ],
      };
    }

    // Check claim status
    if (q.includes('status') || q.includes('review')) {
      if (claims.length > 0) {
        const latest = claims[0];
        return {
          answer: `Your claim ${latest.claim_number} ("${latest.title}") is currently in ${latest.status} status. ${latest.requires_human_review ? 'It is queued for human claims officer review before settlement authorization.' : 'It has completed automated AI intake assessment.'}`,
          references: [
            {
              type: 'claim',
              id: latest.id,
              title: `Claim ${latest.claim_number}`,
            },
          ],
          suggestedQuestions: [
            'What documents do I need for this claim?',
            'What is my deductible?',
            'Show me my active policies',
          ],
        };
      }
    }

    // Default policy summary
    if (policies.length > 0) {
      const pList = policies.map((p) => `• ${p.policy_name} (${p.policy_number}) — ${p.policy_type}, Status: ${p.status}`).join('\n');
      return {
        answer: `You currently have ${policies.length} active policy/policies on file with InsuredYou:\n${pList}\n\nHow can I assist you with your coverage or claims today?`,
        references: policies.map((p) => ({
          type: 'policy' as const,
          id: p.id,
          title: p.policy_name,
        })),
        suggestedQuestions: [
          'Is my car accident covered?',
          'What is my deductible?',
          'What is the status of my claim?',
        ],
      };
    }

    return {
      answer: 'This information could not be verified in your current policy records. Please ensure you have uploaded your insurance policy in the My Policies section.',
      references: [],
      suggestedQuestions: [
        'How do I upload a policy?',
        'How do I submit a new claim?',
      ],
    };
  },
};
