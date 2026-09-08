const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Fraud alert must belong to a user'],
      index: true,
    },
    senderAccount: {
      type: String,
      required: [true, 'Sender account is required'],
      trim: true,
      index: true,
    },
    receiverAccount: {
      type: String,
      required: [true, 'Receiver account is required'],
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transfer amount is required'],
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: 0,
      max: 100,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: [true, 'Risk level is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Primary fraud detection reason is required'],
      trim: true,
    },
    factors: [
      {
        rule: {
          type: String,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        detail: {
          type: String,
          required: true,
        },
      },
    ],
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['NONE', 'OTP_VERIFIED', 'TRANSACTION_HELD', 'ACCOUNT_FROZEN', 'RELEASED', 'REJECTED'],
      default: 'NONE',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fraudAlertSchema.index({ createdAt: -1 });
fraudAlertSchema.index({ status: 1, riskLevel: 1, createdAt: -1 });
fraudAlertSchema.index({ user: 1, createdAt: -1 });

const FraudAlert = mongoose.models.FraudAlert || mongoose.model('FraudAlert', fraudAlertSchema);

module.exports = FraudAlert;
