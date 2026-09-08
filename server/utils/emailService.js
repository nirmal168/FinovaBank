const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // In development or when no SMTP configured, use ethereal test account
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Initialized Ethereal mock transport (${testAccount.user})`);
    } catch (e) {
      // Fallback stub if offline/network restricted
      transporter = {
        sendMail: async (opts) => {
          console.log(`[EmailService STUB] Sending email to ${opts.to}: ${opts.subject}`);
          return { messageId: `mock-${Date.now()}` };
        },
      };
    }
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || '"Finova Security" <security@finova.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });

    if (nodemailer.getTestMessageUrl && info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService Preview URL]: ${previewUrl}`);
      }
    }

    return info;
  } catch (err) {
    console.error('[EmailService Error]:', err.message);
    return null;
  }
};

const sendOtpEmail = async ({ to, otp, purpose, metadata = {} }) => {
  const titles = {
    TRANSFER: 'Authorize High-Value Money Transfer',
    LOGIN: 'Two-Factor Authentication Sign In',
    PASSWORD_RESET: 'Password Reset Request',
    CARD_PIN: 'Debit Card PIN Change Authorization',
  };

  const subject = `Finova Security: ${titles[purpose] || 'Your Verification Code'}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #F7F5EF; border-radius: 16px; border: 1px solid #E2E0DA;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #102A43; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FINOVA</h2>
        <p style="color: #667085; font-size: 13px; margin-top: 4px; font-weight: 500;">Smart Banking. Smarter Future.</p>
      </div>

      <div style="background-color: #FCFBF8; padding: 24px; border-radius: 12px; border: 1px solid #E2E0DA; text-align: center; box-shadow: 0 2px 8px rgba(16,42,67,0.04);">
        <p style="color: #102A43; font-size: 15px; margin-bottom: 8px; font-weight: 600;">
          You requested authorization for: <span style="color: #4F7CAC;">${titles[purpose] || purpose}</span>
        </p>
        ${
          purpose === 'TRANSFER' && metadata.amount
            ? `<p style="color: #667085; font-size: 13px; margin-bottom: 16px;">Transfer Amount: <strong style="color: #102A43;">₹${Number(metadata.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> to Account <strong style="color: #102A43;">#${metadata.receiverAccount}</strong></p>`
            : ''
        }

        <p style="color: #667085; font-size: 13px; margin-bottom: 12px;">Your 6-digit one-time verification passcode is:</p>
        
        <div style="display: inline-block; background-color: #DDEDE4; padding: 14px 32px; border-radius: 10px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #102A43; border: 1px dashed #5B8C72; margin-bottom: 16px;">
          ${otp}
        </div>

        <p style="color: #B85C5C; font-size: 12px; margin: 0; font-weight: 600;">
          Expires in 5 minutes. Do NOT share this code with anyone, including bank staff.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #667085; font-size: 11px;">
        <p style="margin: 0;">If you did not initiate this request, immediately freeze your account in the Finova app or contact support.</p>
        <p style="margin-top: 4px;">© ${new Date().getFullYear()} Finova Inc. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};
