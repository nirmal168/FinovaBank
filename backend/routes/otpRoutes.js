const express = require('express');
const { body, validationResult } = require('express-validator');
const { requestOtp, verifyOtp, resendOtp } = require('../controllers/otpController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { otpLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Apply OTP specific rate limiter (10 attempts / 15 minutes)
router.use(otpLimiter);

// Optional JWT extraction middleware (populates req.user if token is present, but allows guest password-reset/login OTP)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'securebank_fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (err) {
    // Ignore error for optional authentication
  }
  next();
};

router.use(optionalAuth);

// Helper to handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

router.post(
  '/request',
  [
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('OTP purpose is required')
      .isLength({ max: 50 })
      .withMessage('Purpose too long'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidation,
  requestOtp
);

router.post(
  '/verify',
  [
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits'),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('OTP purpose is required'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidation,
  verifyOtp
);

router.post(
  '/resend',
  [
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('OTP purpose is required'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidation,
  resendOtp
);

module.exports = router;
