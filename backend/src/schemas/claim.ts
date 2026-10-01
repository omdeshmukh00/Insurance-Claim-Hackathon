import { z } from 'zod';

export const createClaimSchema = z.object({
  policy_number: z.string().min(3, 'Policy number is required'),
  claim_type: z.enum(['AUTO', 'HEALTH', 'PROPERTY', 'LIFE', 'GENERAL']),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Incident date must be in YYYY-MM-DD format'),
  claim_amount: z.number().positive('Claim amount must be a positive number'),
});

export const updateClaimSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  claim_amount: z.number().positive().optional(),
  status: z
    .enum([
      'SUBMITTED',
      'PROCESSING',
      'UNDER_INVESTIGATION',
      'REQUIRES_INFO',
      'UNDER_REVIEW',
      'APPROVED',
      'SETTLED',
      'REJECTED',
    ])
    .optional(),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigned_officer_id: z.string().uuid().optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
