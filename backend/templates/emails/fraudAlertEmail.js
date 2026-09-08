const { baseTemplate } = require('./baseTemplate');

/**
 * High-Risk / Fraud Security Alert Email Template
 */
const fraudAlertEmail = ({
  name = 'Customer',
  amount,
  riskLevel = 'HIGH',
  riskScore = 85,
  reason = 'Unusual activity detected for this transaction pattern.',
  actionRequired = 'If this was you, please verify via OTP or contact support. If not, freeze your account immediately.',
  frontendUrl = 'http://localhost:5173',
}) => {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const content = `
    <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      Our 24x7 automated security monitoring detected unusual activity associated with your Finova digital banking account.
    </p>

    <!-- Risk Alert Banner -->
    <div style="background-color: #FCE8E6; border: 1px solid #F3B3AE; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B85C5C; letter-spacing: 1px;">
        ⚠ Security Safeguard Active
      </span>
      <div style="font-size: 28px; font-weight: 900; color: #102A43; margin: 6px 0;">
        ${formattedAmount}
      </div>
      <p style="margin: 0; font-size: 12px; font-weight: 700; color: #B85C5C;">
        Assessed Risk Level: ${riskLevel} (${riskScore}/100)
      </p>
    </div>

    <!-- Alert Parameters Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085; width: 35%;">Reason</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${reason}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Recommended Action</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${actionRequired}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #667085;">Incident Timestamp</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>
  `;

  const securityNotice =
    'If you did not initiate this activity, immediately freeze your account in the Finova app or call our emergency hotline at 1800-FINOVA-BK (1800-346-682).';

  const html = baseTemplate({
    title: '⚠ Finova Security Alert',
    content,
    buttonText: 'Manage Account Security',
    buttonUrl: `${frontendUrl.replace(/\/$/, '')}/accounts`,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

SECURITY ALERT: Unusual Activity Detected

Hello ${name},

We detected unusual activity associated with your account:
- Transaction Amount: ${formattedAmount}
- Risk Level: ${riskLevel} (${riskScore}/100)
- Reason: ${reason}
- Action: ${actionRequired}

If this was NOT you, freeze your account immediately:
${frontendUrl.replace(/\/$/, '')}/accounts

Emergency Hotline: 1800-FINOVA-BK (1800-346-682)

Finova Bank Ltd.
  `.trim();

  return {
    subject: `⚠ Finova Security Alert: Unusual Activity Detected (${formattedAmount})`,
    html,
    text,
  };
};

module.exports = {
  fraudAlertEmail,
};
