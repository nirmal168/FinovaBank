const mongoose = require('mongoose');

// Cheque Book Request Schema
const chequeBookRequestSchema = new mongoose.Schema(
  {
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
    numberOfLeaves: {
      type: Number,
      enum: [20, 25, 50, 100],
      default: 25,
      required: true,
    },
    accountType: {
      type: String,
      default: 'Savings',
    },
    deliveryAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Issued', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    chequeBookSeries: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Passbook Request Schema
const passbookRequestSchema = new mongoose.Schema(
  {
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
    requestType: {
      type: String,
      enum: ['New Passbook', 'Renewal / Full', 'Duplicate / Lost'],
      default: 'New Passbook',
      required: true,
    },
    accountType: {
      type: String,
      default: 'Savings',
    },
    deliveryAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Issued', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    passbookNumber: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ChequeBookRequest = mongoose.model('ChequeBookRequest', chequeBookRequestSchema);
const PassbookRequest = mongoose.model('PassbookRequest', passbookRequestSchema);

module.exports = {
  ChequeBookRequest,
  PassbookRequest,
};
