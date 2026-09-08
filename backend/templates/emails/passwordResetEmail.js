const { baseTemplate } = require('./baseTemplate');

/**
 * Password Reset Email Template
 */
const passwordResetEmail = ({
  name = 'Customer',
  resetToken,
  frontendUrl = 'http://localhost:5173',
  expiresInMinutes = 60,
}) => {
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const content = `
    <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      We received a request to reset the password associated with your Finova digital banking account.
    </p>
    <p style="margin: 0 0 20px 0;">
      Click the button below to choose a new password. This single-use link is cryptographically protected and will expire in <strong>${expiresInMinutes} minutes</strong>.
    </p>

    <div style="margin-top: 24px; padding: 12px; background-color: #F7F5EF; border-radius: 8px; font-size: 11px; color: #667085; word-break: break-all;">
      <strong>Direct link fallback:</strong><br/>
      <a href="${resetUrl}" style="color: #4F7CAC; text-decoration: underline;">${resetUrl}</a>
    </div>
  `;

  const securityNotice =
    'If you did not initiate this request, you can safely ignore this email. Your current password will remain unchanged and secure.';

  const html = baseTemplate({
    title: 'Reset Your Finova Password',
    content,
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

Hello ${name},

We received a request to reset your Finova password.

Click or copy the link below to set a new password (expires in ${expiresInMinutes} minutes):
${resetUrl}

If you did not request this, please ignore this email. Your password will remain unchanged.

Finova Bank Ltd.
  `.trim();

  return {
    subject: 'Reset Your Finova Password',
    html,
    text,
  };
};

module.exports = {
  passwordResetEmail,
};
