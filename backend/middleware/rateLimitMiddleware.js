require('dotenv').config();
const rateLimit = require('express-rate-limit');

/**
 * Standard JSON response for rate limit violations
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    statusCode: 429,
    retryAfter: res.getHeader('Retry-After') || '15 minutes',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Global API rate limiter (500 requests per 15 minutes)
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests from this IP. Please try again in a few minutes.'),
});

/**
 * Strict authentication limiter to prevent credential brute forcing (15 attempts per 15 minutes)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'),
});

/**
 * Strict OTP limiter to prevent SMS/Email bombing & code guessing (50 attempts per 15 minutes)
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many OTP requests from this IP. Please wait 15 minutes before requesting again.'),
});

/**
 * High-value financial transfer limiter to prevent rapid automated draining (30 transfers per 15 minutes)
 */
const transferLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Transfer velocity limit reached. For security, please wait 15 minutes before initiating further transfers.'),
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  transferLimiter,
};
