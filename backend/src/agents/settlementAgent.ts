import { z } from 'zod';
import { Claim, Evidence } from '../types/database.js';
import { geminiService } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';

export const settlementRecommendationSchema = z.object({
  recommended_amount: z.number().min(0),
  currency: z.string().default('USD'),
  reason: z.string(),
  calculation_breakdown: z.string(),
  eligible_for_automated_settlement: z.boolean(),
});

export type SettlementRecommendation = z.infer<typeof settlementRecommendationSchema>;

export const settlementAgent = {
  async recommendSettlement(
    claim: Claim,
    evidenceList: Evidence[]
  ): Promise<SettlementRecommendation & { evidenceIds: string[] }> {
    logger.info(`SettlementAgent generating settlement advisory for claim ${claim.id}`);

    const evidenceIds = evidenceList.map((e) => e.id);
    let recommendation: SettlementRecommendation;

    if (geminiService.isConfigured()) {
      try {
        const prompt = `You are a certified Insurance Settlement Advisory AI Agent.
Analyze the claim details and provide a settlement recommendation.

Claim Details:
- Claim ID: ${claim.id}
- Number: ${claim.claim_number}
- Claimed Amount: $${claim.claim_amount}
- Type: ${claim.claim_type}
- Requires Human Review Flag: ${claim.requires_human_review}
- Status: ${claim.status}

Instructions:
1. Recommend an evidence-backed settlement amount. Standard automobile deductible is $500 if applicable.
2. Provide a clear calculation breakdown and reason.
3. Recommend whether this is eligible for automated settlement (ONLY if requires_human_review is false and amount <= 5000).
4. You are strictly advisory. Final disbursement authorization is executed solely by authorized backend officers.`;

        recommendation = await geminiService.generateStructured(
          prompt,
          settlementRecommendationSchema,
          { temperature: 0.1 }
        );
      } catch (err: any) {
        logger.warn(`Gemini settlement advisory fallback used: ${err.message}`);
        recommendation = this.createFallbackRecommendation(claim);
      }
    } else {
      recommendation = this.createFallbackRecommendation(claim);
    }

    return {
      ...recommendation,
      evidenceIds,
    };
  },

  createFallbackRecommendation(claim: Claim): SettlementRecommendation {
    // Standard $500 deductible applied to auto/property claims
    const deductible = claim.claim_type === 'AUTO' || claim.claim_type === 'PROPERTY' ? 500 : 0;
    const recommendedAmount = Math.max(0, claim.claim_amount - deductible);

    return {
      recommended_amount: recommendedAmount,
      currency: 'USD',
      reason: `Claimed amount $${claim.claim_amount} minus standard policy deductible $${deductible}.`,
      calculation_breakdown: `Gross Claim: $${claim.claim_amount} - Deductible: $${deductible} = Net Payable: $${recommendedAmount}`,
      eligible_for_automated_settlement: !claim.requires_human_review && recommendedAmount <= 5000,
    };
  },
};
