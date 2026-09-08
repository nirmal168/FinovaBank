const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Card must belong to a user'],
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Card must be linked to a bank account'],
      index: true,
    },
    maskedCardNumber: {
      type: String,
      required: [true, 'Masked card number is required'],
      trim: true,
    },
    lastFour: {
      type: String,
      required: [true, 'Last 4 digits are required'],
      trim: true,
      index: true,
    },
    cardType: {
      type: String,
      enum: {
        values: [
          'Visa Platinum Debit',
          'Mastercard Gold Debit',
          'Visa Signature Debit',
          'Mastercard World Debit',
        ],
        message: '{VALUE} is not a supported card type',
      },
      default: 'Visa Platinum Debit',
    },
    cardholderName: {
      type: String,
      required: [true, 'Cardholder name is required'],
      trim: true,
    },
    expiryDate: {
      type: String,
      required: [true, 'Expiry date is required'],
      trim: true,
      match: [/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Expiry date must be in MM/YY format'],
    },
    pin: {
      type: String,
      required: [true, 'A 4-digit PIN is required for simulated card security'],
      select: false,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Blocked', 'Inactive'],
        message: '{VALUE} is not a valid card status',
      },
      default: 'Active',
      index: true,
    },
    transactionLimit: {
      type: Number,
      default: 2000.0,
      min: [50, 'Minimum transaction limit is $50.00'],
      max: [10000, 'Maximum transaction limit is $10,000.00'],
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify hashed PIN
cardSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

// Static helper to hash PIN
cardSchema.statics.hashPin = async function (plainPin) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPin, salt);
};

cardSchema.methods.toJSON = function () {
  const card = this.toObject();
  delete card.pin;
  delete card.__v;
  return card;
};

cardSchema.index({ user: 1, createdAt: -1 });

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
