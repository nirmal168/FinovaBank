const nodemailer = require('nodemailer');

/**
 * Checks if mandatory SMTP settings are present in the environment
 */
const isMailConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  return Boolean(host && user && pass);
};

let transporterInstance = null;

/**
 * Creates or returns the reusable Nodemailer transporter.
 * Supports Gmail, Mailtrap, Outlook, SendGrid, Amazon SES, and standard custom SMTPs.
 */
const createMailTransporter = () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (!isMailConfigured()) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    },
    // Safe pool configuration for production reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporterInstance;
};

/**
 * Verifies SMTP connection without exposing passwords or sensitive details.
 * Safe to call during backend startup.
 */
const verifyMailConnection = async () => {
  if (!isMailConfigured()) {
    console.warn(
      '[Finova Mail] Notice: SMTP email service is not configured (SMTP_HOST, SMTP_USER, or SMTP_PASSWORD missing in environment).'
    );
    console.warn(
      '[Finova Mail] Non-critical notification emails will be skipped, and security alerts will record configuration warnings.'
    );
    return {
      configured: false,
      verified: false,
      message: 'SMTP credentials missing in environment variables.',
    };
  }

  try {
    const transporter = createMailTransporter();
    if (!transporter) {
      return {
        configured: false,
        verified: false,
        message: 'Could not create Nodemailer transporter.',
      };
    }

    await transporter.verify();
    console.log(
      `[Finova Mail] ✅ SMTP Transporter verified successfully (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`
    );
    return {
      configured: true,
      verified: true,
      message: 'SMTP connection verified successfully.',
    };
  } catch (error) {
    // Log safe error without passwords or secrets
    console.error(`[Finova Mail] ❌ SMTP Verification failed for ${process.env.SMTP_HOST}: ${error.message}`);
    return {
      configured: true,
      verified: false,
      message: `SMTP connection failed: ${error.message}`,
    };
  }
};

/**
 * Returns default "From" address formatted with brand display name
 */
const getDefaultFromAddress = () => {
  const name = process.env.MAIL_FROM_NAME || 'Finova';
  const address = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || 'security@finovabank.com';
  return `"${name}" <${address}>`;
};

module.exports = {
  createMailTransporter,
  verifyMailConnection,
  isMailConfigured,
  getDefaultFromAddress,
};
