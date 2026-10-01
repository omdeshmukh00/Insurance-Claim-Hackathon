import { z } from 'zod';

export const savePolicySchema = z.object({
  policy_number: z.string().min(3, 'Policy number is required'),
  insurer_name: z.string().min(2, 'Insurer name is required'),
  policy_name: z.string().min(2, 'Policy name is required'),
  policy_type: z.enum(['AUTO', 'HEALTH', 'PROPERTY', 'LIFE', 'GENERAL']),
  policyholder_name: z.string().min(2, 'Policyholder name is required'),
  insured_asset: z.string().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  premium: z.number().min(0, 'Premium must be a non-negative number'),
  deductible: z.number().min(0, 'Deductible must be a non-negative number'),
  coverage: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  limits: z.array(z.string()).default([]),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).default('ACTIVE'),
  document_id: z.string().uuid().optional().nullable(),
  extracted_metadata: z.record(z.string(), z.any()).optional().nullable(),
  evidence: z.any().optional().nullable(),
});

export const updatePolicySchema = savePolicySchema.partial();

export const updatePricingSchema = z.object({
  premium: z.number().min(0, 'Premium must be positive').optional(),
  deductible: z.number().min(0, 'Deductible must be non-negative').optional(),
  limits: z.array(z.string()).optional(),
  coverage: z.array(z.string()).optional(),
});

export type SavePolicyInput = z.infer<typeof savePolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
