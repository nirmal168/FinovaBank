const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Loan must belong to a user'],
      index: true,
    },
    loanType: {
      type: String,
      required: [true, 'Loan type is required'],
      enum: {
        values: ['Personal', 'Education', 'Home', 'Vehicle'],
        message: '{VALUE} is not a supported loan type. Must be Personal, Education, Home, or Vehicle.',
      },
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [500, 'Minimum loan amount is $500.00'],
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0, 'Interest rate cannot be negative'],
    },
    tenure: {
      type: Number,
      required: [true, 'Loan tenure in months is required'],
      min: [3, 'Minimum tenure is 3 months'],
      max: [360, 'Maximum tenure is 360 months (30 years)'],
    },
    emi: {
      type: Number,
      required: [true, 'Calculated monthly EMI is required'],
      min: [0, 'EMI cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining payable amount is required'],
      min: [0, 'Remaining amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid loan status',
      },
      default: 'Pending',
      index: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    rejectedDate: {
      type: Date,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: [200, 'Purpose cannot exceed 200 characters'],
    },
    annualIncome: {
      type: Number,
      min: [0, 'Annual income cannot be negative'],
    },
    employmentStatus: {
      type: String,
      enum: ['Employed', 'Self-Employed', 'Business', 'Student', 'Other'],
      default: 'Employed',
    },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ user: 1, createdAt: -1 });
loanSchema.index({ status: 1, createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
