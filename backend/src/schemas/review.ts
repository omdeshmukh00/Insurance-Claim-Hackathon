import { z } from 'zod';

export const reviewDecisionSchema = z.object({
  decision: z.enum([
    'APPROVE_FOR_PROCESSING',
    'REQUEST_INFORMATION',
    'ESCALATE',
    'REJECT',
  ]),
  notes: z.string().min(3, 'Review notes are required for accountability'),
});

export const requestInformationSchema = z.object({
  required_items: z.array(z.string().min(2)).min(1, 'At least one required item must be specified'),
  reason: z.string().min(3, 'Reason for requesting information is required'),
});

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
export type RequestInformationInput = z.infer<typeof requestInformationSchema>;
