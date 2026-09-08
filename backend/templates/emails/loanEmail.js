const { baseTemplate } = require('./baseTemplate');

/**
 * Loan Decision & Status Notification Email Template
 */
const loanEmail = ({
  name = 'Customer',
  loanId,
  loanType = 'Personal Loan',
  status = 'APPROVED',
  amount,
  interestRate = 8.5,
  termMonths = 36,
  monthlyPayment = 0,
  frontendUrl = 'http://localhost:5173',
}) => {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedEmi = `₹${Number(monthlyPayment || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const statusConfig = {
    APPROVED: {
      headline: 'Congratulations! Your Loan is Approved',
      badgeBg: '#DDEDE4',
      badgeColor: '#17324D',
      message: 'Your loan application has been reviewed and approved by Finova credit underwriting.',
    },
    REJECTED: {
      headline: 'Loan Application Update',
      badgeBg: '#FCE8E6',
      badgeColor: '#B85C5C',
      message:
        'Thank you for your interest in Finova Credit. At this time, we are unable to approve your application based on our current underwriting guidelines.',
    },
    PENDING: {
      headline: 'Loan Application Received',
      badgeBg: '#FEF3D6',
      badgeColor: '#8F6B00',
      message:
        'Your loan application has been submitted successfully and is currently in review by our credit team.',
    },
  };

  const currentStatus = statusConfig[status.toUpperCase()] || statusConfig.PENDING;

  const content = `
    <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      ${currentStatus.message}
    </p>

    <!-- Status & Amount Card -->
    <div style="text-align: center; padding: 20px; background-color: #F7F5EF; border-radius: 12px; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #667085;">
        ${loanType}
      </span>
      <div style="font-size: 32px; font-weight: 900; color: #102A43; margin-top: 4px;">
        ${formattedAmount}
      </div>
      <div style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; background-color: ${currentStatus.badgeBg}; color: ${currentStatus.badgeColor}; text-transform: uppercase;">
        Status: ${status}
      </div>
    </div>

    <!-- Loan Details Breakdown -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Application ID</td>
        <td style="padding: 10px 0; font-weight: 700; color: #102A43; text-align: right; font-family: monospace;">${loanId || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Interest Rate</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${interestRate}% p.a.</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Tenure Duration</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${termMonths} months</td>
      </tr>
      ${
        status.toUpperCase() === 'APPROVED' && monthlyPayment > 0
          ? `
      <tr>
        <td style="padding: 10px 0; color: #667085;">Monthly EMI</td>
        <td style="padding: 10px 0; font-weight: 700; color: #5B8C72; text-align: right;">${formattedEmi}</td>
      </tr>
      `
          : ''
      }
    </table>
  `;

  const securityNotice =
    'Finova will never ask for advance fees or processing charges via external links or non-official payment channels.';

  const html = baseTemplate({
    title: currentStatus.headline,
    content,
    buttonText: 'View Loan Details',
    buttonUrl: `${frontendUrl.replace(/\/$/, '')}/loans`,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

Hello ${name},

Loan Application Update: ${status}
${currentStatus.message}

Details:
- Application ID: ${loanId || 'N/A'}
- Loan Type: ${loanType}
- Amount: ${formattedAmount}
- Interest Rate: ${interestRate}%
- Tenure: ${termMonths} months
${status.toUpperCase() === 'APPROVED' ? `- Monthly EMI: ${formattedEmi}\n` : ''}
View your loan portfolio:
${frontendUrl.replace(/\/$/, '')}/loans

Finova Bank Ltd.
  `.trim();

  return {
    subject: `Finova Loan Application Update: ${status}`,
    html,
    text,
  };
};

module.exports = {
  loanEmail,
};
