const mongoose = require('mongoose');
const generateAccountNumber = require('../utils/generateAccountNumber');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Account must belong to a user'],
      index: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
      index: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: {
        values: ['Savings', 'Current', 'Checking', 'savings', 'current', 'checking'],
        message: '{VALUE} is not a valid account type.',
      },
      default: 'Savings',
    },
    balance: {
      type: Number,
      required: [true, 'Account balance is required'],
      default: 1000.0,
      min: [0, 'Balance cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Frozen', 'Closed', 'ACTIVE', 'FROZEN', 'CLOSED'],
        message: '{VALUE} is not a valid account status. Must be Active, Frozen, or Closed.',
      },
      default: 'Active',
      index: true,
    },
    dailyTransferLimit: {
      type: Number,
      default: 5000.0,
      min: [0, 'Transfer limit cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Static helper to get or auto-create a user's primary active account
accountSchema.statics.getOrCreateUserAccount = async function (userId) {
  let account = await this.findOne({
    user: userId,
    status: { $in: ['Active', 'ACTIVE'] },
  });

  if (!account) {
    // Generate unique account number
    let accountNumber = generateAccountNumber();
    let exists = await this.findOne({ accountNumber });
    while (exists) {
      accountNumber = generateAccountNumber();
      exists = await this.findOne({ accountNumber });
    }

    account = await this.create({
      user: userId,
      accountNumber,
      accountType: 'Savings',
      balance: 1000.0,
      currency: 'INR',
      status: 'Active',
      dailyTransferLimit: 50000.0,
    });
  }

  return account;
};

accountSchema.index({ user: 1, status: 1 });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
