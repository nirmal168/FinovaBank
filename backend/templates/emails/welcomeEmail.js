const { baseTemplate } = require('./baseTemplate');

/**
 * Welcome Email Template for newly onboarded customers
 */
const welcomeEmail = ({ name, customerId, email, frontendUrl = 'http://localhost:5173' }) => {
  const loginUrl = `${frontendUrl.replace(/\/$/, '')}/login`;

  const content = `
    <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      Your Finova customer account has been provisioned by bank administration and is ready to use.
    </p>

    <!-- Account Details Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F7F5EF; border: 1px solid #E2E0DA; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 6px 12px; font-size: 13px; color: #667085; width: 40%;">Customer ID:</td>
        <td style="padding: 6px 12px; font-size: 14px; font-weight: 700; color: #102A43; font-family: monospace;">${customerId}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-size: 13px; color: #667085;">Registered Email:</td>
        <td style="padding: 6px 12px; font-size: 13px; font-weight: 600; color: #102A43;">${email}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-size: 13px; color: #667085;">Account Status:</td>
        <td style="padding: 6px 12px; font-size: 12px; font-weight: 700; color: #5B8C72; text-transform: uppercase;">Active</td>
      </tr>
    </table>

    <p style="margin: 0 0 12px 0;">
      Your account comes equipped with 24/7 digital banking, fund transfers, statements, and debit card controls.
    </p>
    <p style="margin: 0 0 8px 0; font-size: 13px; color: #667085;">
      For your security, you must rotate and set your permanent password upon first login.
    </p>
  `;

  const securityNotice =
    'Finova Bank will never ask for your password, PIN, or OTP over email or phone. Always check that the URL starts with your official Finova portal address.';

  const html = baseTemplate({
    title: 'Welcome to Finova Digital Banking',
    content,
    buttonText: 'Login to Finova',
    buttonUrl: loginUrl,
    securityNotice,
  });

  const text = `
FINOVA - Smart Banking. Smarter Future.
========================================

Welcome to Finova, ${name}!

Your customer account has been created by bank administration.

Account Details:
- Customer ID: ${customerId}
- Registered Email: ${email}
- Status: Active

Your account is ready to use. For security, you must change your temporary password after your first login.

Log in to your account here:
${loginUrl}

Security Notice:
Never share your password or security codes with anyone.

Finova Bank Ltd.
  `.trim();

  return {
    subject: 'Welcome to Finova',
    html,
    text,
  };
};

module.exports = {
  welcomeEmail,
};
