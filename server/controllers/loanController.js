const Loan = require('../models/Loan');
const { calculateEmi, DEFAULT_INTEREST_RATES } = require('../utils/calculateEmi');
const { createNotification } = require('../utils/notificationService');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans
 * @access  Private (JWT customer)
 */
exports.applyLoan = async (req, res, next) => {
  try {
    const {
      loanType,
      amount,
      interestRate,
      tenure,
      purpose,
      annualIncome,
      employmentStatus,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    const parsedTenure = parseInt(tenure, 10);

    if (isNaN(parsedAmount) || parsedAmount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount must be at least $500.00.',
      });
    }

    if (isNaN(parsedTenure) || parsedTenure < 3 || parsedTenure > 360) {
      return res.status(400).json({
        success: false,
        message: 'Loan tenure must be between 3 and 360 months.',
      });
    }

    // Determine interest rate: use user-provided rate if valid or fallback to benchmark rate
    const rate = interestRate !== undefined && !isNaN(parseFloat(interestRate)) && parseFloat(interestRate) > 0
      ? parseFloat(interestRate)
      : (DEFAULT_INTEREST_RATES[loanType] || 10.0);

    // Calculate monthly EMI and total payable amount
    const { emi, totalPayable, totalInterest } = calculateEmi(parsedAmount, rate, parsedTenure);

    // Create loan application in Pending status
    const loan = await Loan.create({
      user: req.user._id,
      loanType,
      amount: parsedAmount,
      interestRate: rate,
      tenure: parsedTenure,
      emi,
      remainingAmount: totalPayable,
      status: 'Pending',
      applicationDate: new Date(),
      purpose: purpose?.trim() || `${loanType} Loan Application`,
      annualIncome: annualIncome ? parseFloat(annualIncome) : undefined,
      employmentStatus: employmentStatus || 'Employed',
    });

    // Auto-trigger LOAN notification
    await createNotification({
      user: req.user._id,
      title: 'Loan Application Submitted',
      message: `Your ${loanType} loan application for $${parsedAmount.toLocaleString()} has been received and is pending administrative review.`,
      type: 'LOAN',
    });

    // Audit log LOAN_APPLY event
    await logAuditEvent({
      user: req.user._id,
      action: 'LOAN_APPLY',
      entity: 'Loan',
      entityId: loan._id,
      req,
      metadata: {
        loanType: loan.loanType,
        amount: loan.amount,
        interestRate: loan.interestRate,
        tenure: loan.tenure,
        emi: loan.emi,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully and is currently under review.',
      loan: {
        _id: loan._id,
        loanType: loan.loanType,
        amount: loan.amount,
        interestRate: loan.interestRate,
        tenure: loan.tenure,
        emi: loan.emi,
        remainingAmount: loan.remainingAmount,
        totalInterest,
        status: loan.status,
        applicationDate: loan.applicationDate,
        purpose: loan.purpose,
        employmentStatus: loan.employmentStatus,
        createdAt: loan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all loans for current user
 * @route   GET /api/loans
 * @access  Private (JWT)
 */
exports.getLoans = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : { user: req.user._id };

    if (req.query.status && ['Pending', 'Approved', 'Rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.loanType && ['Personal', 'Education', 'Home', 'Vehicle'].includes(req.query.loanType)) {
      filter.loanType = req.query.loanType;
    }

    const loans = await Loan.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single loan details by ID
 * @route   GET /api/loans/:id
 * @access  Private (JWT)
 */
exports.getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user', 'name email phone');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found.',
      });
    }

    // Ownership check
    if (loan.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this loan application.',
      });
    }

    // Recompute total interest breakdown for client convenience
    const totalPayable = Math.round(loan.emi * loan.tenure * 100) / 100;
    const totalInterest = Math.round((totalPayable - loan.amount) * 100) / 100;

    res.status(200).json({
      success: true,
      loan: {
        ...loan.toObject(),
        totalPayable,
        totalInterest,
      },
    });
  } catch (error) {
    next(error);
  }
};
