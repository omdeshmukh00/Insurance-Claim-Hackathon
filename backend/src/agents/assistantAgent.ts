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
    policyId?: string,
    screenContext?: Record<string, any>
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
- Premium: ₹${p.premium} | Deductible: ₹${p.deductible}
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
- Amount: ₹${c.claim_amount}
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

    const screenDetails = screenContext
      ? `User's Current Active Screen:
- Screen Route: ${screenContext.pathname || 'N/A'}
- Screen Title: ${screenContext.title || 'N/A'}
- Screen Purpose: ${screenContext.description || screenContext.summary || 'N/A'}
- Available Actions: ${screenContext.actions || 'N/A'}`
      : '';

    if (geminiService.isConfigured()) {
      try {
        const prompt = `You are InsuredYou AI Claims Assistant — a context-aware insurance intelligence copilot.
You are assisting an authenticated policyholder who is looking at a specific screen in the application.

${screenDetails}

User's Verified Policies:
${policiesContext || 'No active policies on file.'}

User's Submitted Claims:
${claimsContext || 'No claims submitted.'}

${extraContext}

User Question: "${message}"

CRITICAL INSTRUCTIONS:
1. If the user asks about the current screen or what this screen is telling about or how to use it, explain the active screen, what it displays, and the actions available.
2. If the user asks about an event or policy coverage, answer accurately citing policy numbers, deductibles in ₹, and coverage limits.
3. If the user asks about claims, answer citing their actual claims in ₹.
4. When citing monetary amounts, always format in Indian Rupees (₹).
5. Provide 2-3 helpful, contextual suggested questions.`;

        const response = await geminiService.generateStructured(
          prompt,
          assistantResponseSchema,
          { temperature: 0.1 }
        );

        return response;
      } catch (err: any) {
        logger.warn(`Gemini assistant fallback: ${err.message}`);
        return this.createFallbackResponse(message, policies, claims, focusedClaim, missingInfoItems, screenContext);
      }
    }

    return this.createFallbackResponse(message, policies, claims, focusedClaim, missingInfoItems, screenContext);
  },

  createFallbackResponse(
    message: string,
    policies: any[],
    claims: any[],
    focusedClaim: any,
    missingInfo: any[],
    screenContext?: Record<string, any>
  ): AssistantResponse {
    const q = message.toLowerCase().trim();

    // 1. Screen Explanation Query ("what is this screen", "tell me about this screen", "explain this page", "what does this show")
    if (
      q.includes('screen') ||
      q.includes('page') ||
      q.includes('what is this') ||
      q.includes('tell me about') ||
      q.includes('what does this') ||
      q.includes('what can i do') ||
      q.includes('explain')
    ) {
      if (screenContext && screenContext.description) {
        return {
          answer: `You are currently on the **${screenContext.title || 'Current'}** screen (\`${screenContext.pathname || ''}\`).\n\n📌 **What this screen is telling about:**\n${screenContext.description}\n\n⚡ **Actions you can take here:**\n${screenContext.actions || 'You can review on-screen details, navigate tabs, or ask me any question.'}`,
          references: [],
          suggestedQuestions: [
            'How do I file a claim?',
            'What is my deductible?',
            'What perils are covered?',
          ],
        };
      }
    }

    // 2. Greetings ("hi", "hello", "hey")
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ')) {
      const screenNote = screenContext?.title
        ? `You are on the **${screenContext.title}** screen (\`${screenContext.pathname || ''}\`). ${screenContext.description || ''}`
        : 'Welcome to InsuredYou Claims Intelligence.';

      return {
        answer: `Hello! 👋 ${screenNote}\n\nI can help you understand what's on this screen, check your policy coverage, calculate deductibles in ₹, or guide your claims. What would you like to know?`,
        references: [],
        suggestedQuestions: [
          'What is this screen telling about?',
          'What is my deductible?',
          'Show me my submitted claims',
        ],
      };
    }

    // 3. Check claims on claims screen or when asking about claims
    if (q.includes('claim') && !q.includes('policy')) {
      if (claims.length > 0) {
        const cList = claims
          .map(
            (c) =>
              `• Claim **${c.claim_number}** ("${c.title}"): Amount ₹${Number(c.claim_amount || 0).toLocaleString()}, Status: **${c.status}** (${c.requires_human_review ? 'Queued for human review' : 'Automated processing'})`
          )
          .join('\n');
        return {
          answer: `Here is the current status of your submitted claims:\n\n${cList}\n\nYou can click on any claim on the Claims Activity screen to view the live multi-agent investigation and evidence citations.`,
          references: claims.map((c) => ({
            type: 'claim' as const,
            id: c.id,
            title: `Claim ${c.claim_number}`,
          })),
          suggestedQuestions: [
            'What documents are missing?',
            'How is net settlement computed?',
            'How do I file a new claim?',
          ],
        };
      }
      return {
        answer: 'You currently have no claims submitted. You can click "+ File New Claim" on the Claims Activity screen to submit a new claim against your active policies.',
        references: [],
        suggestedQuestions: ['How do I file a claim?', 'What perils are covered?'],
      };
    }

    // 4. Check deductible
    if (q.includes('deductible')) {
      const autoPolicy = policies.find((p) => p.policy_type === 'AUTO') || policies[0];
      if (autoPolicy) {
        return {
          answer: `Your deductible for policy ${autoPolicy.policy_number} (${autoPolicy.policy_name}) is ₹${Number(autoPolicy.deductible || 0).toLocaleString()} per occurrence. This amount is subtracted from eligible approved repair damages before claim payout disbursement.`,
          references: [
            {
              type: 'policy',
              id: autoPolicy.id,
              title: `${autoPolicy.policy_number} — ${autoPolicy.policy_name}`,
              quote: `Standard compulsory deductible: ₹${autoPolicy.deductible}`,
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

    // 5. Check covered / accident / perils
    if (q.includes('covered') || q.includes('accident') || q.includes('collision') || q.includes('peril')) {
      const autoPolicy = policies.find((p) => p.policy_type === 'AUTO') || policies[0];
      if (autoPolicy) {
        return {
          answer: `Yes, vehicular accident, collision, and own damage is covered under your ${autoPolicy.policy_name} (${autoPolicy.policy_number}) subject to your ₹${Number(autoPolicy.deductible || 0).toLocaleString()} compulsory deductible. Covered events include fire, theft, collision, and storm damage.`,
          references: [
            {
              type: 'policy',
              id: autoPolicy.id,
              title: autoPolicy.policy_name,
              quote: autoPolicy.coverage[0] || 'Own damage and collision coverage',
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

    // 6. Check missing documents
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
        answer: 'For a motor own damage claim, required documents include: (1) itemized repair estimate, (2) photographs of vehicle damage, (3) copy of driving licence, and (4) police FIR if third-party injury or theft is involved.',
        references: [],
        suggestedQuestions: [
          'What is my deductible?',
          'What is the status of my claim?',
          'How do I submit a claim?',
        ],
      };
    }

    // 7. Policy portfolio query (when explicitly asking for policies)
    if (q.includes('policy') || q.includes('policies') || q.includes('portfolio') || q.includes('coverage')) {
      if (policies.length > 0) {
        const pList = policies
          .map(
            (p) =>
              `• **${p.policy_name}** (${p.policy_number}) — ${p.policy_type}, Status: **${p.status}**, Premium: ₹${Number(p.premium || 0).toLocaleString()}, Deductible: ₹${Number(p.deductible || 0).toLocaleString()}`
          )
          .join('\n');
        return {
          answer: `You currently have ${policies.length} active policy/policies on file with InsuredYou:\n\n${pList}\n\nWould you like details on coverage limits, deductibles, or to file a claim?`,
          references: policies.map((p) => ({
            type: 'policy' as const,
            id: p.id,
            title: p.policy_name,
          })),
          suggestedQuestions: [
            'What is my deductible?',
            'Is accidental collision covered?',
            'How do I file a claim?',
          ],
        };
      }
    }

    // 8. General fallback: contextual to screen if available, else informative
    if (screenContext && screenContext.description) {
      return {
        answer: `You are on the **${screenContext.title || 'Claims Workspace'}** screen (\`${screenContext.pathname || ''}\`).\n\n${screenContext.description}\n\nHow can I help you with this screen, your active policies, or submitted claims?`,
        references: [],
        suggestedQuestions: [
          'What is on this screen?',
          'What is my deductible?',
          'How do I file a claim?',
        ],
      };
    }

    return {
      answer: 'I can assist you with understanding any screen in InsuredYou, verifying policy coverage, calculating deductibles in ₹, or tracking submitted claims. What would you like to check?',
      references: [],
      suggestedQuestions: [
        'What is this screen telling about?',
        'What is my deductible?',
        'How do I file a claim?',
      ],
    };
  },
};

