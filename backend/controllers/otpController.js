const otpService = require('../services/otpService');
const User = require('../models/User');

// @desc    Request a new OTP for specified purpose
// @route   POST /api/otp/request
// @access  Public / Private (supports both)
const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose, metadata } = req.body;
    const targetEmail = req.user ? req.user.email : email;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: 'OTP purpose is required.',
      });
    }

    const result = await otpService.sendOtp({
      user: req.user ? req.user._id : undefined,
      email: targetEmail,
      purpose,
      metadata: metadata || {},
    });

    res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn,
      cooldown: result.cooldown,
    });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        cooldownRemaining: error.cooldownRemaining,
      });
    }
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/otp/verify
// @access  Public / Private
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;
    const targetEmail = req.user ? req.user.email : email;

    if (!targetEmail || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and purpose are required.',
      });
    }

    const verification = await otpService.verifyOtp({
      email: targetEmail,
      otp,
      purpose,
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message,
        remainingAttempts: verification.remainingAttempts,
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      metadata: verification.metadata,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP respecting cooldown
// @route   POST /api/otp/resend
// @access  Public / Private
const resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const targetEmail = req.user ? req.user.email : email;

    if (!targetEmail || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required to resend OTP.',
      });
    }

    const result = await otpService.sendOtp({
      user: req.user ? req.user._id : undefined,
      email: targetEmail,
      purpose,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      cooldown: result.cooldown,
    });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        cooldownRemaining: error.cooldownRemaining,
      });
    }
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
  resendOtp,
};
