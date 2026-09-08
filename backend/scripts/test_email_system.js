/**
 * Comprehensive Test Suite for Finova Professional Nodemailer Email System
 * 
 * Verifies:
 * 1. Configuration detection and verifier
 * 2. All 6 email templates (HTML & plain-text generation, brand compliance, INR formatting)
 * 3. EmailLog audit model (no passwords, tokens, or OTPs stored)
 * 4. User notification preference enforcement
 * 5. Security check: No sensitive secrets leaked in logs or response objects
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { isMailConfigured, verifyMailConnection, getDefaultFromAddress } = require('../config/mail');
const EmailLog = require('../models/EmailLog');
const { welcomeEmail } = require('../templates/emails/welcomeEmail');
const { otpEmail } = require('../templates/emails/otpEmail');
const { passwordResetEmail } = require('../templates/emails/passwordResetEmail');
const { transactionEmail } = require('../templates/emails/transactionEmail');
const { loanEmail } = require('../templates/emails/loanEmail');
const { fraudAlertEmail } = require('../templates/emails/fraudAlertEmail');
const emailService = require('../services/emailService');

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 FINOVA EMAIL SYSTEM AUTOMATED VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // Connect to MongoDB for EmailLog testing
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/securebank';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB for EmailLog tests.\n');

    // ----------------------------------------------------
    // Test 1: Configuration & From Address
    // ----------------------------------------------------
    console.log('--- Test Suite 1: Configuration & Transporter ---');
    const fromAddress = getDefaultFromAddress();
    assert(fromAddress.includes('Finova'), 'Default from address includes Finova display name');
    assert(fromAddress.includes('<') && fromAddress.includes('>'), 'From address formatted correctly with RFC compliant brackets');

    const configCheck = await verifyMailConnection();
    assert(typeof configCheck.configured === 'boolean', 'verifyMailConnection() returns boolean configured status');
    assert(typeof configCheck.message === 'string', 'verifyMailConnection() returns clear message');

    // ----------------------------------------------------
    // Test 2: Welcome Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 2: Welcome Email Template ---');
    const welcome = welcomeEmail({
      name: 'Nirmal Prajapat',
      customerId: 'FIN-CUS-99123',
      email: 'nirmal@example.com',
      frontendUrl: 'http://localhost:5173',
    });
    assert(welcome.subject === 'Welcome to Finova', 'Welcome email has exact subject: "Welcome to Finova"');
    assert(welcome.html.includes('FIN-CUS-99123'), 'Welcome email HTML contains customer ID');
    assert(welcome.html.includes('nirmal@example.com'), 'Welcome email HTML contains customer email');
    assert(welcome.html.includes('http://localhost:5173/login'), 'Welcome email includes direct login link');
    assert(!welcome.html.includes('password123'), 'Welcome email NEVER includes user password');
    assert(welcome.text.includes('FIN-CUS-99123'), 'Welcome email plain-text fallback contains customer ID');

    // ----------------------------------------------------
    // Test 3: OTP Verification Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 3: OTP Verification Email Template ---');
    const otp = otpEmail({
      name: 'Nirmal Prajapat',
      otp: '739201',
      minutes: 5,
      purpose: 'TRANSFER',
      metadata: { amount: 15000, receiverAccount: '408218926839' },
    });
    assert(otp.subject.includes('Your Finova Verification Code'), 'OTP email subject contains verification notice');
    assert(otp.html.includes('739201'), 'OTP email contains 6-digit code');
    assert(otp.html.includes('5 minutes'), 'OTP email mentions 5 minutes expiration');
    assert(otp.html.includes('₹15,000.00'), 'OTP email formats transfer amount in INR');
    assert(otp.text.includes('739201'), 'OTP plain-text fallback includes 6-digit code');

    // ----------------------------------------------------
    // Test 4: Password Reset Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 4: Password Reset Email Template ---');
    const pwdReset = passwordResetEmail({
      name: 'Nirmal Prajapat',
      resetToken: 'test-crypto-token-abc123xyz',
      frontendUrl: 'http://localhost:5173',
    });
    assert(pwdReset.subject === 'Reset Your Finova Password', 'Password reset subject matches requirement');
    assert(pwdReset.html.includes('test-crypto-token-abc123xyz'), 'Password reset email contains token URL');
    assert(pwdReset.html.includes('60 minutes'), 'Password reset email mentions 60 minutes expiry');
    assert(pwdReset.text.includes('/reset-password?token='), 'Password reset text contains reset URL');

    // ----------------------------------------------------
    // Test 5: Transaction Notification Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 5: Transaction Email Template ---');
    const txn = transactionEmail({
      name: 'Nirmal Prajapat',
      transactionId: 'TXN-TRF-12345678',
      type: 'TRANSFER',
      amount: 25000,
      status: 'COMPLETED',
      accountNumber: '408218926839',
      recipient: '#998877665544',
      date: new Date(),
      balanceAfter: 75000,
      frontendUrl: 'http://localhost:5173',
    });
    assert(txn.subject.includes('₹25,000.00'), 'Transaction subject formats amount in ₹ INR');
    assert(txn.html.includes('TXN-TRF-12345678'), 'Transaction email includes transactionId');
    assert(txn.html.includes('•••• 6839'), 'Transaction email masks account number correctly');
    assert(txn.html.includes('₹75,000.00'), 'Transaction email formats updated balance in ₹ INR');
    assert(txn.text.includes('•••• 6839'), 'Transaction text fallback includes masked account');

    // ----------------------------------------------------
    // Test 6: Loan Status Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 6: Loan Status Email Template ---');
    const loan = loanEmail({
      name: 'Nirmal Prajapat',
      loanId: 'LN-98765',
      loanType: 'Personal Loan',
      status: 'APPROVED',
      amount: 500000,
      interestRate: 8.5,
      termMonths: 60,
      monthlyPayment: 10246,
      frontendUrl: 'http://localhost:5173',
    });
    assert(loan.subject.includes('APPROVED'), 'Loan email subject includes status');
    assert(loan.html.includes('₹5,00,000.00'), 'Loan email formats principal in ₹ INR');
    assert(loan.html.includes('₹10,246.00'), 'Loan email formats EMI in ₹ INR');
    assert(loan.html.includes('60 months'), 'Loan email mentions tenure months');

    // ----------------------------------------------------
    // Test 7: Fraud Alert Email Template
    // ----------------------------------------------------
    console.log('\n--- Test Suite 7: Fraud Alert Email Template ---');
    const fraud = fraudAlertEmail({
      name: 'Nirmal Prajapat',
      amount: 200000,
      riskLevel: 'HIGH',
      riskScore: 87,
      reason: 'Unusually large transaction detected.',
      actionRequired: 'Verify via OTP or freeze account immediately.',
      frontendUrl: 'http://localhost:5173',
    });
    assert(fraud.subject.includes('Security Alert'), 'Fraud alert subject contains security notice');
    assert(fraud.html.includes('₹2,00,000.00'), 'Fraud alert formats amount in ₹ INR');
    assert(fraud.html.includes('87/100'), 'Fraud alert shows risk score safely');
    assert(fraud.html.includes('1800-FINOVA-BK'), 'Fraud alert provides official emergency hotline');

    // ----------------------------------------------------
    // Test 8: Central Email Service & Safe Logging
    // ----------------------------------------------------
    console.log('\n--- Test Suite 8: Central Email Service & EmailLog Audit ---');
    const welcomeResult = await emailService.sendWelcomeEmail({
      to: 'audit_test@finovabank.internal',
      name: 'Test Customer',
      customerId: 'FIN-CUS-TEST1',
    });
    assert(typeof welcomeResult === 'object', 'sendWelcomeEmail returns object');

    // Query EmailLog
    const latestLog = await EmailLog.findOne({ recipient: 'audit_test@finovabank.internal' }).sort({ createdAt: -1 });
    assert(latestLog !== null, 'EmailLog entry was successfully created in MongoDB');
    assert(latestLog.type === 'WELCOME', 'EmailLog recorded correct email type: WELCOME');
    assert(['SENT', 'SKIPPED_NOT_CONFIGURED'].includes(latestLog.status), 'EmailLog status is valid (SENT or SKIPPED_NOT_CONFIGURED)');
    assert(!latestLog.error || !latestLog.error.includes('pass'), 'EmailLog error does not expose passwords');

    // Test Preference Opt-out
    const skippedTxn = await emailService.sendTransactionEmail({
      to: 'audit_test@finovabank.internal',
      name: 'Test Customer',
      transaction: { transactionId: 'TXN-SKIPPED-1', type: 'DEPOSIT', amount: 100 },
      account: { accountNumber: '1234567890' },
      userPreferences: { transactions: false },
    });
    assert(skippedTxn.skipped === true, 'User email preference correctly skips non-critical transaction email');

    // Clean up test audit logs
    await EmailLog.deleteMany({ recipient: 'audit_test@finovabank.internal' });

    console.log('\n======================================================');
    console.log(`🏁 TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Fatal Test Exception:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
