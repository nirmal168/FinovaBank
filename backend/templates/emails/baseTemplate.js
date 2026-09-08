/**
 * Reusable Base Email Template for Finova Digital Banking
 * Implements strict inline CSS for maximum email-client compatibility (Gmail, Outlook, Apple Mail, etc.)
 */

const baseTemplate = ({
  title,
  content,
  buttonText = null,
  buttonUrl = null,
  securityNotice = null,
}) => {
  const currentYear = new Date().getFullYear();

  const buttonHtml =
    buttonText && buttonUrl
      ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 16px auto;">
          <tr>
            <td align="center" style="border-radius: 10px; background-color: #17324D;">
              <a href="${buttonUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #FCFBF8; text-decoration: none; border-radius: 10px; letter-spacing: 0.2px; text-transform: uppercase;">
                ${buttonText}
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

  const securityHtml = securityNotice
    ? `
        <div style="margin-top: 24px; padding: 14px 16px; background-color: #F7F5EF; border-left: 3px solid #5B8C72; border-radius: 6px;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #102A43; line-height: 1.5;">
            <strong>Security Notice:</strong> ${securityNotice}
          </p>
        </div>
      `
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Finova Notification'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F7F5EF; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FCFBF8; border-radius: 16px; border: 1px solid #E2E0DA; box-shadow: 0 4px 16px rgba(16, 42, 67, 0.04); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #102A43; padding: 28px 32px; text-align: center; border-bottom: 3px solid #5B8C72;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1.5px; color: #FCFBF8;">FINOVA</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 500; color: #4F7CAC; letter-spacing: 0.5px;">Smart Banking. Smarter Future.</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              ${
                title
                  ? `<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #102A43; letter-spacing: -0.3px;">${title}</h2>`
                  : ''
              }
              <div style="font-size: 14px; line-height: 1.6; color: #17324D;">
                ${content}
              </div>

              ${buttonHtml}
              ${securityHtml}
            </td>
          </tr>

          <!-- Regulatory & Safety Footer -->
          <tr>
            <td style="background-color: #F7F5EF; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E0DA;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #102A43;">
                Finova Bank • Smart Banking. Smarter Future.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #667085; line-height: 1.4;">
                Academic / Portfolio banking simulation platform. Regulated sandbox environment.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #8F99A8;">
                © ${currentYear} Finova Bank Ltd. All rights reserved. Do not reply directly to this automated email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return html;
};

module.exports = {
  baseTemplate,
};
