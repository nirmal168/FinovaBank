const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true,
    },
    senderAccount: {
      type: String,
      required: [true, 'Sender account identifier is required'],
      trim: true,
    },
    receiverAccount: {
      type: String,
      required: [true, 'Receiver account identifier is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: {
        values: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAYMENT', 'REFUND'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED', 'HELD'],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'COMPLETED',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after transaction is required'],
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ senderAccount: 1, createdAt: -1 });
transactionSchema.index({ receiverAccount: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
