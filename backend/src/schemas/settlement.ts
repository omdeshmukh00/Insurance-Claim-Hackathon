import { z } from 'zod';

export const settleClaimSchema = z.object({
  settlement_amount: z.number().positive('Settlement amount must be positive'),
  currency: z.string().default('USD'),
  reason: z.string().min(5, 'Reason for settlement approval is required'),
  payment_reference: z.string().optional(),
});

export type SettleClaimInput = z.infer<typeof settleClaimSchema>;
