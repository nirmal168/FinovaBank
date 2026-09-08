const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required for OTP dispatch'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: [true, 'Secure OTP hash is required'],
    },
    purpose: {
      type: String,
      enum: {
        values: ['LOGIN', 'TRANSFER', 'PASSWORD_RESET', 'CARD_PIN'],
        message: '{VALUE} is not a valid OTP purpose',
      },
      required: [true, 'OTP purpose is required'],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-prune expired records
    },
    resendAfter: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active OTP by email and purpose
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
