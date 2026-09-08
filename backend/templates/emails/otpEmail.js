const { baseTemplate } = require('./baseTemplate');

/**
 * OTP Verification Email Template
 */
const otpEmail = ({ name = 'Customer', otp, minutes = 5, purpose = 'VERIFICATION', metadata = {} }) => {
  const purposeDescriptions = {
    TRANSFER: 'Authorize Money Transfer',
    LOGIN: 'Two-Factor Authentication Sign In',
    PASSWORD_RESET: 'Password Reset Verification',
    CARD_PIN: 'Debit Card PIN Authorization',
    BENEFICIARY: 'Add New Payee / Beneficiary',
  };

  const readablePurpose = purposeDescriptions[purpose] || purpose.replace(/_/g, ' ');

  const content = `
    <p style="margin: 0 0 14px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      We received a request to authorize: <strong style="color: #4F7CAC;">${readablePurpose}</strong>.
    </p>

    ${
      purpose === 'TRANSFER' && metadata.amount
        ? `
      <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #F7F5EF; border-radius: 8px; font-size: 13px; color: #17324D;">
        Transfer Amount: <strong style="color: #102A43;">₹${Number(metadata.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        ${metadata.receiverAccount ? ` to Account: <strong style="font-family: monospace;">#${metadata.receiverAccount}</strong>` : ''}
      </div>
      `
        : ''
    }

    <p style="margin: 0 0 12px 0; font-size: 13px; color: #667085;">
      Your 6-digit one-time verification passcode is:
    </p>

    <!-- Prominent OTP Display Box -->
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background-color: #F7F5EF; padding: 16px 36px; border-radius: 12px; border: 2px dashed #5B8C72;">
        <span style="font-family: monospace, Courier, sans-serif; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #102A43;">
          ${otp}
        </span>
      </div>
    </div>

    <p style="margin: 0 0 8px 0; text-align: center; font-size: 12px; font-weight: 600; color: #B85C5C;">
      ⏳ This verification code expires in ${minutes} minutes.
    </p>
  `;

  const securityNotice =
    'Never share this code with anyone, including Finova bank representatives. Finova employees will never contact you asking for your one-time password.';

  const html = baseTemplate({
    title: 'Your Finova Verification Code',
    content,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

Hello ${name},

Your Finova verification code is: ${otp}

Purpose: ${readablePurpose}
Expires in: ${minutes} minutes

Security Notice:
Never share this code with anyone. Finova will never ask for your verification code. If you did not request this, please freeze your account immediately in the Finova app.

Finova Bank Ltd.
  `.trim();

  return {
    subject: 'Your Finova Verification Code',
    html,
    text,
  };
};

module.exports = {
  otpEmail,
};
