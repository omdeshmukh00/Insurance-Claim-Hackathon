export interface EmailTemplateData {
  recipientName?: string;
  claimNumber?: string;
  claimTitle?: string;
  claimAmount?: number;
  currency?: string;
  status?: string;
  reason?: string;
  policyNumber?: string;
  insurerName?: string;
  policyType?: string;
  missingItems?: string[];
  reviewNotes?: string[];
  actionUrl?: string;
}

export const emailTemplateService = {
  render(templateName: string, data: EmailTemplateData): { subject: string; html: string; text: string } {
    const claimNumber = data.claimNumber || 'N/A';
    const amountStr = data.claimAmount !== undefined ? `$${data.claimAmount.toLocaleString()}` : '';

    const wrapLayout = (title: string, bodyContent: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8f7; margin: 0; padding: 0; color: #1f2937; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(6, 78, 59, 0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #064e3b 0%, #059669 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .badge { display: inline-block; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-submitted { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-settled { background: #fef3c7; color: #92400e; }
    .badge-review { background: #fff7ed; color: #c2410c; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .meta-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .meta-label { color: #6b7280; font-weight: 500; }
    .meta-value { color: #111827; font-weight: 600; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>InsuredYou</h1>
      <p>AI Insurance Claims Intelligence</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated notification from InsuredYou Claims Intelligence.</p>
      <p>&copy; ${new Date().getFullYear()} InsuredYou. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    switch (templateName) {
      case 'claim-submitted':
        return {
          subject: `Claim Received: ${claimNumber} - InsuredYou`,
          text: `Your claim ${claimNumber} has been received and is queued for verification.`,
          html: wrapLayout(
            'Claim Received',
            `<h2>Claim Submission Confirmed</h2>
            <p>Hello ${data.recipientName || 'Valued Policyholder'},</p>
            <p>Your claim has been successfully registered in the InsuredYou claims intelligence platform.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Claim Number:</span><span class="meta-value">${claimNumber}</span></div>
              <div class="meta-row"><span class="meta-label">Title:</span><span class="meta-value">${data.claimTitle || 'N/A'}</span></div>
              <div class="meta-row"><span class="meta-label">Claimed Amount:</span><span class="meta-value">${amountStr}</span></div>
              <div class="meta-row"><span class="meta-label">Status:</span><span class="badge badge-submitted">SUBMITTED</span></div>
            </div>
            <p>Our autonomous document and coverage verification engines will begin inspecting your documentation shortly.</p>`
          ),
        };

      case 'policy-analysed':
        return {
          subject: `Policy Analysed: ${data.policyNumber || 'Your Policy'} - InsuredYou`,
          text: `Your insurance policy document has been successfully analysed by InsuredYou AI.`,
          html: wrapLayout(
            'Policy Analysed',
            `<h2>Policy Analysis Complete</h2>
            <p>Hello ${data.recipientName || 'Valued Policyholder'},</p>
            <p>Your uploaded insurance policy has been processed and indexed for autonomous claims assistance.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Policy Number:</span><span class="meta-value">${data.policyNumber || 'N/A'}</span></div>
              <div class="meta-row"><span class="meta-label">Insurer:</span><span class="meta-value">${data.insurerName || 'N/A'}</span></div>
              <div class="meta-row"><span class="meta-label">Policy Type:</span><span class="meta-value">${data.policyType || 'General'}</span></div>
            </div>
            <p>You can now ask questions about your policy coverage and file instant evidence-grounded claims.</p>`
          ),
        };

      case 'missing-information':
        return {
          subject: `Action Required: Missing Information for Claim ${claimNumber}`,
          text: `Additional documentation is needed for claim ${claimNumber}.`,
          html: wrapLayout(
            'Information Requested',
            `<h2>Action Required: Additional Information Needed</h2>
            <p>Our claim assessment engine identified required items before claim <strong>${claimNumber}</strong> can proceed:</p>
            <ul>
              ${(data.missingItems || ['Additional proof of loss or invoice']).map((item) => `<li><strong>${item}</strong></li>`).join('')}
            </ul>
            <p>Please log in to your InsuredYou portal to upload the requested documents.</p>`
          ),
        };

      case 'human-review':
        return {
          subject: `Claim ${claimNumber} Assigned for Human Review`,
          text: `Claim ${claimNumber} requires review by a claims officer.`,
          html: wrapLayout(
            'Human Review Required',
            `<h2>Claim Assigned for Specialist Review</h2>
            <p>Claim <strong>${claimNumber}</strong> has been flagged for human review by our intelligence engine.</p>
            <p>Reason: ${data.reason || 'Complex claim conditions or inconsistency detected'}</p>
            <p>A claims specialist has been assigned to inspect the evidence package.</p>`
          ),
        };

      case 'claim-approved':
        return {
          subject: `Claim Approved: ${claimNumber} - InsuredYou`,
          text: `Good news! Your claim ${claimNumber} has been approved.`,
          html: wrapLayout(
            'Claim Approved',
            `<h2>Claim Approved</h2>
            <p>Congratulations, your claim <strong>${claimNumber}</strong> has been approved for settlement.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Approved Amount:</span><span class="meta-value">${amountStr}</span></div>
              <div class="meta-row"><span class="meta-label">Status:</span><span class="badge badge-approved">APPROVED</span></div>
            </div>
            <p>${data.reason || 'All coverage rules and documentation verified successfully.'}</p>`
          ),
        };

      case 'claim-settled':
        return {
          subject: `Claim Settled & Disbursed: ${claimNumber} - InsuredYou`,
          text: `Settlement for claim ${claimNumber} has been finalized.`,
          html: wrapLayout(
            'Claim Settled',
            `<h2>Settlement Finalized</h2>
            <p>Settlement disbursement for claim <strong>${claimNumber}</strong> has been executed.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Settlement Amount:</span><span class="meta-value">${amountStr}</span></div>
              <div class="meta-row"><span class="meta-label">Status:</span><span class="badge badge-settled">SETTLED</span></div>
            </div>`
          ),
        };

      case 'claim-rejected':
        return {
          subject: `Decision Notice: Claim ${claimNumber} - InsuredYou`,
          text: `Claim ${claimNumber} has not been approved.`,
          html: wrapLayout(
            'Decision Notice',
            `<h2>Claim Decision</h2>
            <p>We have completed the assessment for claim <strong>${claimNumber}</strong>.</p>
            <p>Following comprehensive policy and evidence review, the claim could not be approved at this time.</p>
            <p><strong>Reason:</strong> ${data.reason || 'Policy exclusion or insufficient documentation'}</p>`
          ),
        };

      default:
        return {
          subject: `Notification regarding Claim ${claimNumber} - InsuredYou`,
          text: `Status update regarding claim ${claimNumber}`,
          html: wrapLayout('Claim Update', `<p>Status update regarding claim ${claimNumber}</p>`),
        };
    }
  },
};
