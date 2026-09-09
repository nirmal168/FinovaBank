const { baseTemplate } = require('./baseTemplate');

/**
 * Deposit / Withdrawal Request Decision Email Template
 */
const depositWithdrawalEmail = ({
  name = 'Customer',
  requestId,
  type = 'DEPOSIT', // 'DEPOSIT' | 'WITHDRAWAL'
  amount,
  status = 'APPROVED', // 'APPROVED' | 'REJECTED'
  accountNumber = '',
  transactionId = null,
  date = new Date(),
  adminNote = '',
  frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173',
}) => {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const lastFour = accountNumber ? accountNumber.slice(-4) : '••••';
  const formattedDate = new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isDeposit = type === 'DEPOSIT';
  const isApproved = status === 'APPROVED';

  const actionTitle = isApproved
    ? isDeposit
      ? 'Deposit Request Approved'
      : 'Withdrawal Request Approved'
    : isDeposit
    ? 'Deposit Request Rejected'
    : 'Withdrawal Request Rejected';

  const statusColor = isApproved ? '#5B8C72' : '#B91C1C';
  const statusBadgeBg = isApproved ? '#DDEDE4' : '#FEE2E2';
  const statusBadgeText = isApproved ? '#17324D' : '#991B1B';

  const introText = isApproved
    ? isDeposit
      ? `Your deposit request of <strong>${formattedAmount}</strong> has been reviewed, approved by a Finova administrator, and successfully credited to your account.`
      : `Your withdrawal request of <strong>${formattedAmount}</strong> has been reviewed, approved by a Finova administrator, and successfully debited from your account.`
    : `Your ${type.toLowerCase()} request of <strong>${formattedAmount}</strong> has been reviewed by an administrator and was <strong>rejected</strong>.`;

  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">
      ${introText}
    </p>

    <!-- Amount Hero Card -->
    <div style="text-align: center; padding: 22px; background-color: #F7F5EF; border-radius: 12px; margin-bottom: 24px; border: 1px solid #E2E0DA;">
      <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #667085;">
        ${type} Request
      </span>
      <div style="font-size: 32px; font-weight: 900; color: ${statusColor}; margin-top: 4px;">
        ${formattedAmount}
      </div>
      <div style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; background-color: ${statusBadgeBg}; color: ${statusBadgeText}; text-transform: uppercase; letter-spacing: 0.5px;">
        ${status}
      </div>
    </div>

    <!-- Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Request ID</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #102A43; font-family: monospace;">${requestId}</td>
      </tr>
      ${
        transactionId
          ? `
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Transaction ID</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #102A43; font-family: monospace;">${transactionId}</td>
      </tr>`
          : ''
      }
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Account Number</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #102A43;">••••${lastFour}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Request Type</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #102A43;">${type}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Processed Date</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #102A43;">${formattedDate}</td>
      </tr>
      ${
        adminNote
          ? `
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; font-weight: 600;">Admin Remarks</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #B91C1C;">${adminNote}</td>
      </tr>`
          : ''
      }
    </table>

    <p style="margin: 0; font-size: 13px; color: #667085; line-height: 1.5;">
      You can track the complete history of all your banking requests by accessing your Finova customer portal.
    </p>
  `;

  return {
    subject: `${actionTitle}: ${formattedAmount} [${requestId}]`,
    html: baseTemplate({
      title: actionTitle,
      content,
      buttonText: 'View Request History',
      buttonUrl: `${frontendUrl}/deposit-withdrawal-requests`,
      securityNotice:
        'Finova Bank will never request your login passwords, PINs, or OTPs over phone or email. If you did not initiate this request, contact institutional support immediately.',
    }),
  };
};

module.exports = {
  depositWithdrawalEmail,
};
