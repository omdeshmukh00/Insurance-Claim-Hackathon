import nodemailer, { type Transporter } from 'nodemailer';
import { randomUUID } from 'crypto';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { isSupabaseConfigured, getSupabaseAdmin } from '../config/supabase.js';
import { inMemoryStore } from '../repositories/inMemoryStore.js';
import { emailTemplateService, EmailTemplateData } from './emailTemplateService.js';
import { Claim, EmailLog } from '../types/database.js';
import { profileRepository } from '../repositories/index.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (!config.SMTP_USER || !config.SMTP_PASSWORD) {
    logger.warn('SMTP credentials not configured. Emails will be logged to database without dispatching to network.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export interface SendEmailOptions {
  claimId?: string;
  to: string;
  template: string;
  data: EmailTemplateData;
}

export const emailService = {
  async sendEmail(options: SendEmailOptions): Promise<EmailLog> {
    const { subject, html, text } = emailTemplateService.render(options.template, options.data);
    const fromAddress = config.EMAIL_FROM
      ? `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`
      : '"AI Claims Team" <claims@example.com>';

    let status = 'SENT';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;

    try {
      const mailer = getTransporter();
      if (mailer) {
        const info = await mailer.sendMail({
          from: fromAddress,
          to: options.to,
          subject,
          text,
          html,
        });
        providerMessageId = info.messageId || null;
        logger.info(`Email dispatched via SMTP: [${options.template}] to ${options.to}`, {
          messageId: providerMessageId,
        });
      } else {
        status = 'SIMULATED';
        providerMessageId = `sim-${randomUUID()}`;
        logger.info(`Email simulated (SMTP unconfigured): [${options.template}] to ${options.to}`);
      }
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message || 'SMTP delivery failed';
      logger.error(`Failed to send email [${options.template}] to ${options.to}`, { error: errorMessage });
    }

    const log: EmailLog = {
      id: randomUUID(),
      claim_id: options.claimId || null,
      recipient: options.to,
      subject,
      template: options.template,
      status,
      provider_message_id: providerMessageId,
      error: errorMessage,
      sent_at: new Date().toISOString(),
    };

    // Save to email_logs
    if (isSupabaseConfigured()) {
      try {
        await getSupabaseAdmin().from('email_logs').insert(log);
      } catch (err: any) {
        logger.warn('Failed to insert email_log into Supabase', { error: err.message });
      }
    } else {
      inMemoryStore.emailLogs.set(log.id, log);
    }

    return log;
  },

  async sendClaimSubmittedNotification(claim: Claim): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'claim-submitted',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        claimTitle: claim.title,
        claimAmount: claim.claim_amount,
        status: claim.status,
      },
    });
  },

  async sendInvestigationCompleteNotification(claim: Claim, summary: string): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'investigation-complete',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        status: claim.status,
        reason: summary,
      },
    });
  },

  async sendMissingInfoNotification(claim: Claim, missingItems: string[]): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'missing-information',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        missingItems,
      },
    });
  },

  async sendHumanReviewNotification(claim: Claim, reason: string): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'human-review',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        reason,
      },
    });
  },

  async sendClaimApprovedNotification(claim: Claim, amount: number, notes?: string): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'claim-approved',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        claimAmount: amount,
        reason: notes,
      },
    });
  },

  async sendClaimSettledNotification(claim: Claim, amount: number): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'claim-settled',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        claimAmount: amount,
      },
    });
  },

  async sendClaimRejectedNotification(claim: Claim, reason: string): Promise<void> {
    const profile = await profileRepository.findById(claim.claimant_id);
    const to = profile?.email || 'claimant@example.com';
    await this.sendEmail({
      claimId: claim.id,
      to,
      template: 'claim-rejected',
      data: {
        recipientName: profile?.full_name || 'Policyholder',
        claimNumber: claim.claim_number,
        reason,
      },
    });
  },
};
