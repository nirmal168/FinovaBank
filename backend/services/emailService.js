const {
  createMailTransporter,
  isMailConfigured,
  getDefaultFromAddress,
} = require('../config/mail');
const EmailLog = require('../models/EmailLog');
const { welcomeEmail } = require('../templates/emails/welcomeEmail');
const { otpEmail } = require('../templates/emails/otpEmail');
const { passwordResetEmail } = require('../templates/emails/passwordResetEmail');
const { transactionEmail } = require('../templates/emails/transactionEmail');
const { loanEmail } = require('../templates/emails/loanEmail');
const { fraudAlertEmail } = require('../templates/emails/fraudAlertEmail');

/**
 * Strips HTML tags for clean plain-text fallback if text is not explicitly supplied
 */
const htmlToTextFallback = (html = '') => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Central Send Email Dispatcher
 */
const sendEmail = async ({
  to,
  subject,
  html,
  text = null,
  type = 'GENERAL',
  metadata = {},
}) => {
  const normalizedTo = (to || '').toLowerCase().trim();
  const plainText = text || htmlToTextFallback(html);

  // 1. Check if SMTP is configured in environment
  if (!isMailConfigured()) {
    console.warn(`[Finova Mail] Skipped email to ${normalizedTo} (${type}): SMTP service is not configured.`);

    try {
      await EmailLog.create({
        recipient: normalizedTo,
        type,
        subject,
        status: 'SKIPPED_NOT_CONFIGURED',
        metadata,
      });
    } catch (logErr) {
      // Non-fatal logging error
    }

    return {
      success: false,
      skipped: true,
      error: 'Email service is not configured in environment variables.',
    };
  }

  // 2. Transporter instance
  const transporter = createMailTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Unable to initialize email transporter.',
    };
  }

  try {
    const from = getDefaultFromAddress();
    const info = await transporter.sendMail({
      from,
      to: normalizedTo,
      subject,
      text: plainText,
      html,
    });

    // 3. Record successful delivery to audit log
    try {
      await EmailLog.create({
        recipient: normalizedTo,
        type,
        subject,
        status: 'SENT',
        messageId: info.messageId,
        metadata,
      });
    } catch (logErr) {
      // Non-fatal
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`[Finova Mail] ❌ Failed to send ${type} email to ${normalizedTo}: ${error.message}`);

    // Record failure in audit log (NEVER logging passwords or secrets)
    try {
      await EmailLog.create({
        recipient: normalizedTo,
        type,
        subject,
        status: 'FAILED',
        error: error.message,
        metadata,
      });
    } catch (logErr) {
      // Non-fatal
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 1. Send Welcome Email to newly created Customer
 */
const sendWelcomeEmail = async ({ to, name, customerId }) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const { subject, html, text } = welcomeEmail({
    name,
    customerId,
    email: to,
    frontendUrl,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'WELCOME',
    metadata: { customerId },
  });
};

/**
 * 2. Send 6-Digit OTP Verification Email
 */
const sendOtpEmail = async ({ to, name, otp, minutes = 5, purpose = 'VERIFICATION', metadata = {} }) => {
  const { subject, html, text } = otpEmail({
    name,
    otp,
    minutes,
    purpose,
    metadata,
  });

  // Safe metadata only — NEVER record raw OTP in email log metadata!
  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'OTP',
    metadata: { purpose },
  });
};

/**
 * 3. Send Password Reset Link Email
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const { subject, html, text } = passwordResetEmail({
    name,
    resetToken,
    frontendUrl,
    expiresInMinutes: 60,
  });

  // Safe metadata only — NEVER record raw resetToken in email log metadata!
  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'PASSWORD_RESET',
    metadata: { hasToken: true },
  });
};

/**
 * 4. Send Transaction Notification Email (Supports user notification preference)
 */
const sendTransactionEmail = async ({
  to,
  name,
  transaction,
  account,
  recipient = null,
  userPreferences = null,
}) => {
  // Check customer preferences for non-critical emails
  if (userPreferences && userPreferences.transactions === false) {
    try {
      await EmailLog.create({
        recipient: (to || '').toLowerCase().trim(),
        type: 'TRANSACTION',
        subject: `Transaction Alert: ${transaction.type}`,
        status: 'SKIPPED_PREFERENCE',
        metadata: { transactionId: transaction.transactionId },
      });
    } catch (e) {}
    return { success: true, skipped: true, reason: 'Disabled by user preferences' };
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const { subject, html, text } = transactionEmail({
    name,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    status: transaction.status,
    accountNumber: account?.accountNumber || transaction.senderAccount || transaction.receiverAccount,
    recipient,
    date: transaction.createdAt || new Date(),
    balanceAfter: transaction.balanceAfter,
    frontendUrl,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'TRANSACTION',
    metadata: {
      transactionId: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
    },
  });
};

/**
 * 5. Send Loan Application Status Email (Supports user notification preference)
 */
const sendLoanStatusEmail = async ({ to, name, loan, userPreferences = null }) => {
  // Check customer preferences for non-critical emails
  if (userPreferences && userPreferences.loans === false) {
    try {
      await EmailLog.create({
        recipient: (to || '').toLowerCase().trim(),
        type: 'LOAN_STATUS',
        subject: `Loan Application Update: ${loan.status}`,
        status: 'SKIPPED_PREFERENCE',
        metadata: { loanId: loan._id || loan.loanId },
      });
    } catch (e) {}
    return { success: true, skipped: true, reason: 'Disabled by user preferences' };
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const { subject, html, text } = loanEmail({
    name,
    loanId: loan._id ? loan._id.toString() : loan.loanId,
    loanType: loan.loanType || loan.type || 'Personal Loan',
    status: loan.status,
    amount: loan.amount,
    interestRate: loan.interestRate || 8.5,
    termMonths: loan.termMonths || loan.tenure || 36,
    monthlyPayment: loan.monthlyPayment || loan.emi || 0,
    frontendUrl,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'LOAN_STATUS',
    metadata: {
      loanId: loan._id ? loan._id.toString() : loan.loanId,
      status: loan.status,
      amount: loan.amount,
    },
  });
};

/**
 * 6. Send High Risk / Fraud Alert Email (Critical security alert — never skipped)
 */
const sendFraudAlertEmail = async ({ to, name, alertData }) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const { subject, html, text } = fraudAlertEmail({
    name,
    amount: alertData.amount,
    riskLevel: alertData.riskLevel || 'HIGH',
    riskScore: alertData.riskScore || 85,
    reason: alertData.reason || 'Unusual high-risk transaction pattern detected.',
    actionRequired: alertData.actionRequired || 'Review your transaction and verify authorization.',
    frontendUrl,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
    type: 'FRAUD_ALERT',
    metadata: {
      riskLevel: alertData.riskLevel,
      riskScore: alertData.riskScore,
    },
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendTransactionEmail,
  sendLoanStatusEmail,
  sendFraudAlertEmail,
};
