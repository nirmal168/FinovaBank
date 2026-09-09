const mongoose = require('mongoose');

const depositWithdrawalRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Request must belong to a user'],
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Request must be linked to an account'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['DEPOSIT', 'WITHDRAWAL'],
        message: '{VALUE} is not a valid request type. Must be DEPOSIT or WITHDRAWAL.',
      },
      required: [true, 'Request type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        message: '{VALUE} is not a valid status.',
      },
      default: 'PENDING',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for querying
depositWithdrawalRequestSchema.index({ user: 1, createdAt: -1 });
depositWithdrawalRequestSchema.index({ type: 1, status: 1 });
depositWithdrawalRequestSchema.index({ status: 1, requestedAt: -1 });

// Helper to generate unique request ID formatted like FIN-REQ-10021
depositWithdrawalRequestSchema.statics.generateRequestId = async function () {
  let unique = false;
  let requestId = '';
  while (!unique) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    requestId = `FIN-REQ-${randomNum}`;
    const existing = await this.findOne({ requestId });
    if (!existing) unique = true;
  }
  return requestId;
};

const DepositWithdrawalRequest = mongoose.model(
  'DepositWithdrawalRequest',
  depositWithdrawalRequestSchema
);

module.exports = DepositWithdrawalRequest;
