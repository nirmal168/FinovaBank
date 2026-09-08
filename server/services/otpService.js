const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailService');

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

/**
 * Reusable OTP Service
 */
const otpService = {
  /**
   * Generates cryptographically secure 6-digit numeric OTP
   */
  generateOtpCode: () => {
    // Generate secure 6-digit number between 100000 and 999999
    return crypto.randomInt(100000, 1000000).toString();
  },

  /**
   * Hashes OTP using bcrypt before database persistence
   */
  hashOtp: async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  },

  /**
   * Generates and dispatches an OTP to user's email
   */
  sendOtp: async ({ user, email, purpose, metadata = {} }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing active OTP and enforce 60s resend cooldown
    const existingOtp = await Otp.findOne({
      email: normalizedEmail,
      purpose,
    });

    const now = new Date();
    if (existingOtp && existingOtp.resendAfter > now) {
      const waitSeconds = Math.ceil((existingOtp.resendAfter.getTime() - now.getTime()) / 1000);
      const error = new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
      error.statusCode = 429;
      error.cooldownRemaining = waitSeconds;
      throw error;
    }

    // Generate fresh OTP code
    const rawOtp = otpService.generateOtpCode();
    const otpHash = await otpService.hashOtp(rawOtp);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_MS);

    // Replace or create OTP record
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      {
        user: user || undefined,
        email: normalizedEmail,
        otpHash,
        purpose,
        metadata,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        expiresAt,
        resendAfter,
      },
      { upsert: true, new: true }
    );

    // Send via email service
    await sendOtpEmail({
      to: normalizedEmail,
      otp: rawOtp,
      purpose,
      metadata,
    });

    return {
      success: true,
      message: `OTP sent successfully to ${normalizedEmail}`,
      expiresIn: '5 minutes',
      cooldown: 60,
    };
  },

  /**
   * Verifies submitted OTP against securely hashed record
   */
  verifyOtp: async ({ email, otp, purpose }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose,
    });

    if (!otpRecord) {
      return {
        valid: false,
        message: 'No active OTP found or code has expired. Please request a new code.',
      };
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return {
        valid: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return {
        valid: false,
        message: 'Maximum attempts exceeded. This OTP has been invalidated for security.',
      };
    }

    // Compare hash
    const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;
      return {
        valid: false,
        message:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : 'Invalid OTP. Maximum attempts exceeded. Code has been invalidated.',
        remainingAttempts: Math.max(0, remainingAttempts),
      };
    }

    // Success: consume / delete OTP record to prevent replay
    const savedMetadata = otpRecord.metadata;
    await Otp.deleteOne({ _id: otpRecord._id });

    return {
      valid: true,
      metadata: savedMetadata,
    };
  },
};

module.exports = otpService;
