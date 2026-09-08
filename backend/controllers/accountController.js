const Account = require('../models/Account');
const generateAccountNumber = require('../utils/generateAccountNumber');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Create a new bank account
// @route   POST /api/accounts
// @access  Private (Bearer token)
const createAccount = async (req, res, next) => {
  try {
    const { accountType, initialDeposit, currency, dailyTransferLimit } = req.body;

    // Validate accountType
    const normalizedType =
      accountType?.toLowerCase() === 'current' ? 'Current' : 'Savings';

    const openingBalance =
      initialDeposit !== undefined ? parseFloat(initialDeposit) : 1000.0;

    if (isNaN(openingBalance) || openingBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Initial deposit cannot be negative.',
      });
    }

    // Generate unique account number
    let accountNumber = generateAccountNumber();
    let exists = await Account.findOne({ accountNumber });
    while (exists) {
      accountNumber = generateAccountNumber();
      exists = await Account.findOne({ accountNumber });
    }

    const targetUserId =
      req.user.role === 'admin' && (req.body.userId || req.body.customerId || req.body.user)
        ? (req.body.userId || req.body.customerId || req.body.user)
        : req.user._id;

    const account = await Account.create({
      user: targetUserId,
      accountNumber,
      accountType: normalizedType,
      balance: parseFloat(openingBalance.toFixed(2)),
      currency: currency?.toUpperCase() || 'INR',
      status: 'Active',
      dailyTransferLimit:
        dailyTransferLimit !== undefined ? parseFloat(dailyTransferLimit) : 50000.0,
    });

    await logAuditEvent({
      req,
      user: req.user._id,
      action: 'ACCOUNT_CREATE',
      entity: 'Account',
      entityId: account._id,
      metadata: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        openingBalance: account.balance,
        currency: account.currency,
      },
    });

    res.status(201).json({
      success: true,
      message: `${account.accountType} account created successfully.`,
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
        dailyTransferLimit: account.dailyTransferLimit,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accounts for the authenticated user
// @route   GET /api/accounts
// @access  Private (Bearer token)
const getAccounts = async (req, res, next) => {
  try {
    // If admin requests with all=true query parameter, can view all accounts
    const filter =
      req.user.role === 'admin' && req.query.all === 'true'
        ? {}
        : { user: req.user._id };

    // Auto-ensure at least one primary account exists for the user
    await Account.getOrCreateUserAccount(req.user._id);

    const accounts = await Account.find(filter).sort({ createdAt: -1 });

    const totalBalance = accounts.reduce(
      (sum, acc) => (acc.status !== 'Closed' ? sum + acc.balance : sum),
      0
    );

    res.status(200).json({
      success: true,
      count: accounts.length,
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      accounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get account details by ID
// @route   GET /api/accounts/:id
// @access  Private (Bearer token)
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Ownership check: User must own the account unless they are an admin
    if (
      account.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this account.',
      });
    }

    res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Freeze / Unfreeze / Update account status
// @route   PUT /api/accounts/:id/status
// @access  Private (Bearer token)
const updateAccountStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Active', 'Frozen', 'Closed'];
    const matchedStatus = validStatuses.find(
      (s) => s.toLowerCase() === status?.toLowerCase()
    );

    if (!matchedStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be Active, Frozen, or Closed.`,
      });
    }

    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Ownership check: User can freeze/unfreeze their own account, or admin
    if (
      account.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this account.',
      });
    }

    account.status = matchedStatus;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Account has been updated to ${matchedStatus}.`,
      account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup account details for transfer recipient verification
// @route   GET /api/accounts/lookup/:accountNumber
// @access  Private (Bearer token)
const lookupAccount = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;
    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Account number is required.',
      });
    }

    const account = await Account.findOne({
      accountNumber: accountNumber.trim(),
    }).populate('user', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Recipient account not found. Please verify the 12-digit number.',
      });
    }

    const isSelf = account.user && account.user._id.toString() === req.user._id.toString();

    res.status(200).json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        status: account.status,
        recipientName: account.user ? account.user.name : 'Verified Customer',
        isSelf,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccountStatus,
  lookupAccount,
};
