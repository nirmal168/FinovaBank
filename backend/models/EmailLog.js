const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'WELCOME',
        'OTP',
        'PASSWORD_RESET',
        'TRANSACTION',
        'LOAN_STATUS',
        'FRAUD_ALERT',
        'GENERAL',
      ],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SKIPPED_NOT_CONFIGURED', 'SKIPPED_PREFERENCE'],
      required: true,
      index: true,
    },
    messageId: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying audit trail
emailLogSchema.index({ recipient: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
