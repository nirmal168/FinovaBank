const { baseTemplate } = require('./baseTemplate');

/**
 * Transaction Notification Email Template
 */
const transactionEmail = ({
  name = 'Customer',
  transactionId,
  type,
  amount,
  status = 'COMPLETED',
  accountNumber = '',
  recipient = null,
  date = new Date(),
  balanceAfter = null,
  frontendUrl = 'http://localhost:5173',
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

  const typeLabels = {
    DEPOSIT: 'Deposit Credited',
    WITHDRAW: 'Cash Withdrawal',
    TRANSFER: 'Fund Transfer',
    PAYMENT: 'Merchant Payment',
  };

  const actionTitle = typeLabels[type] || `${type} Transaction`;
  const isCredit = type === 'DEPOSIT';

  const content = `
    <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      A transaction on your Finova account has been successfully processed.
    </p>

    <!-- Amount Hero Card -->
    <div style="text-align: center; padding: 20px; background-color: #F7F5EF; border-radius: 12px; margin-bottom: 24px;">
      <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #667085;">
        ${actionTitle}
      </span>
      <div style="font-size: 32px; font-weight: 900; color: ${isCredit ? '#5B8C72' : '#102A43'}; margin-top: 4px;">
        ${isCredit ? '+' : '-'}${formattedAmount}
      </div>
      <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: #DDEDE4; color: #17324D; text-transform: uppercase;">
        Status: ${status}
      </div>
    </div>

    <!-- Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Transaction ID</td>
        <td style="padding: 10px 0; font-weight: 700; color: #102A43; text-align: right; font-family: monospace;">${transactionId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Account</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">•••• ${lastFour}</td>
      </tr>
      ${
        recipient
          ? `
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Recipient</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${recipient}</td>
      </tr>
      `
          : ''
      }
      <tr style="border-bottom: 1px solid #E2E0DA;">
        <td style="padding: 10px 0; color: #667085;">Date & Time</td>
        <td style="padding: 10px 0; font-weight: 600; color: #102A43; text-align: right;">${formattedDate}</td>
      </tr>
      ${
        balanceAfter !== null
          ? `
      <tr>
        <td style="padding: 10px 0; color: #667085;">Updated Balance</td>
        <td style="padding: 10px 0; font-weight: 700; color: #102A43; text-align: right;">₹${Number(balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
      `
          : ''
      }
    </table>
  `;

  const securityNotice =
    'If you did not authorize this transaction, please immediately lock your cards or contact Finova 24x7 Customer Support at 1800-FINOVA-BK.';

  const html = baseTemplate({
    title: 'Finova Transaction Alert',
    content,
    buttonText: 'View Transaction History',
    buttonUrl: `${frontendUrl.replace(/\/$/, '')}/transactions`,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

Hello ${name},

Transaction Alert: ${actionTitle}
Amount: ${isCredit ? '+' : '-'}${formattedAmount}
Status: ${status}

Transaction ID: ${transactionId}
Account: •••• ${lastFour}
${recipient ? `Recipient: ${recipient}\n` : ''}Date: ${formattedDate}
${balanceAfter !== null ? `Available Balance: ₹${Number(balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` : ''}
If you did not recognize this transaction, immediately contact Finova Customer Support.

Finova Bank Ltd.
  `.trim();

  return {
    subject: `Finova Transaction Alert: ${actionTitle} (${formattedAmount})`,
    html,
    text,
  };
};

module.exports = {
  transactionEmail,
};
