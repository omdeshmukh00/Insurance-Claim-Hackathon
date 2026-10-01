export interface EmailTemplateData {
  recipientName?: string;
  claimNumber?: string;
  claimTitle?: string;
  claimAmount?: number;
  currency?: string;
  status?: string;
  reason?: string;
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #2d3748; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .badge { display: inline-block; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-submitted { background: #dbeafe; color: #1e40af; }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-settled { background: #e0e7ff; color: #4338ca; }
    .badge-review { background: #fef3c7; color: #b45309; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .meta-label { color: #64748b; font-weight: 500; }
    .meta-value { color: #0f172a; font-weight: 600; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Insurance Claims Intelligence</h1>
      <p>Automated & Evidence-Backed Claims Processing</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated notification from the Claims Intelligence System.</p>
      <p>&copy; ${new Date().getFullYear()} Claims Intelligence Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    switch (templateName) {
      case 'claim-submitted':
        return {
          subject: `Claim Received: ${claimNumber}`,
          text: `Your claim ${claimNumber} has been received and is queued for verification.`,
          html: wrapLayout(
            'Claim Received',
            `<h2>Claim Submission Confirmed</h2>
            <p>Hello ${data.recipientName || 'Valued Policyholder'},</p>
            <p>Your claim has been successfully registered in our claims intelligence platform.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Claim Number:</span><span class="meta-value">${claimNumber}</span></div>
              <div class="meta-row"><span class="meta-label">Title:</span><span class="meta-value">${data.claimTitle || 'N/A'}</span></div>
              <div class="meta-row"><span class="meta-label">Claimed Amount:</span><span class="meta-value">${amountStr}</span></div>
              <div class="meta-row"><span class="meta-label">Status:</span><span class="badge badge-submitted">SUBMITTED</span></div>
            </div>
            <p>Our autonomous document and coverage verification engines will begin inspecting your documentation shortly.</p>`
          ),
        };

      case 'investigation-complete':
        return {
          subject: `Investigation Completed: ${claimNumber}`,
          text: `AI investigation has concluded for claim ${claimNumber}.`,
          html: wrapLayout(
            'Investigation Completed',
            `<h2>Claim Investigation Concluded</h2>
            <p>The multi-agent intelligence analysis for claim <strong>${claimNumber}</strong> is complete.</p>
            <div class="meta-card">
              <div class="meta-row"><span class="meta-label">Claim:</span><span class="meta-value">${claimNumber}</span></div>
              <div class="meta-row"><span class="meta-label">Status:</span><span class="meta-value">${data.status || 'PROCESSED'}</span></div>
            </div>
            <p>${data.reason || 'All supporting policy documents and evidence have been correlated.'}</p>`
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
            <p>Please log in to your claims portal to upload the requested documents.</p>`
          ),
        };

      case 'human-review':
        return {
          subject: `Claim ${claimNumber} Assigned for Human Review`,
          text: `Claim ${claimNumber} requires review by a claims officer.`,
          html: wrapLayout(
            'Human Review Required',
            `<h2>Claim Assigned for Staff Assessment</h2>
            <p>Claim <strong>${claimNumber}</strong> has been flagged for human review by our intelligence engine.</p>
            <p>Reason: ${data.reason || 'Complex claim conditions or inconsistency detected'}</p>
            <p>A claims specialist has been assigned to inspect the evidence package.</p>`
          ),
        };

      case 'claim-approved':
        return {
          subject: `Claim Approved: ${claimNumber}`,
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
          subject: `Claim Settled & Disbursed: ${claimNumber}`,
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
          subject: `Decision Notice: Claim ${claimNumber}`,
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
          subject: `Notification regarding Claim ${claimNumber}`,
          text: `Status update regarding claim ${claimNumber}`,
          html: wrapLayout('Claim Update', `<p>Status update regarding claim ${claimNumber}</p>`),
        };
    }
  },
};
