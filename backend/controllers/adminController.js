const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Card = require('../models/Card');
const FraudAlert = require('../models/FraudAlert');
const AuditLog = require('../models/AuditLog');
const DepositWithdrawalRequest = require('../models/DepositWithdrawalRequest');
const generateTransactionId = require('../utils/generateTransactionId');
const generateAccountNumber = require('../utils/generateAccountNumber');
const { createNotification } = require('../utils/notificationService');
const { logAuditEvent } = require('../utils/auditLogger');
const emailService = require('../services/emailService');

/**
 * @desc    Get aggregated administrative statistics & Recharts datasets
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core Counts & Amounts
    const [
      totalCustomers,
      totalAccounts,
      depositStats,
      withdrawalStats,
      transferStats,
      loanStats,
      pendingLoanStats,
      suspiciousTxList,
      pendingDepositRequests,
      pendingWithdrawalRequests,
    ] = await Promise.all([
      // Total Customers
      User.countDocuments({ role: 'customer' }),

      // Total Accounts
      Account.countDocuments(),

      // Total Deposits
      Transaction.aggregate([
        { $match: { type: 'DEPOSIT' } },
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Total Withdrawals
      Transaction.aggregate([
        { $match: { type: 'WITHDRAW' } },
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Total Transfers
      Transaction.aggregate([
        { $match: { type: 'TRANSFER' } },
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Total Loans
      Loan.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Pending Loans
      Loan.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Suspicious Transactions (Flagged: amount >= $5,000 OR status === 'FAILED')
      Transaction.find({
        $or: [{ amount: { $gte: 5000 } }, { status: 'FAILED' }],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email'),

      // Pending Deposit Requests
      DepositWithdrawalRequest.countDocuments({ type: 'DEPOSIT', status: 'PENDING' }),

      // Pending Withdrawal Requests
      DepositWithdrawalRequest.countDocuments({ type: 'WITHDRAWAL', status: 'PENDING' }),
    ]);

    const totalDeposits = {
      count: depositStats[0]?.count || 0,
      amount: Math.round((depositStats[0]?.totalAmount || 0) * 100) / 100,
    };

    const totalWithdrawals = {
      count: withdrawalStats[0]?.count || 0,
      amount: Math.round((withdrawalStats[0]?.totalAmount || 0) * 100) / 100,
    };

    const totalTransfers = {
      count: transferStats[0]?.count || 0,
      amount: Math.round((transferStats[0]?.totalAmount || 0) * 100) / 100,
    };

    const totalLoans = {
      count: loanStats[0]?.count || 0,
      amount: Math.round((loanStats[0]?.totalAmount || 0) * 100) / 100,
    };

    const pendingLoans = {
      count: pendingLoanStats[0]?.count || 0,
      amount: Math.round((pendingLoanStats[0]?.totalAmount || 0) * 100) / 100,
    };

    const suspiciousCount = await Transaction.countDocuments({
      $or: [{ amount: { $gte: 5000 } }, { status: 'FAILED' }],
    });

    // 2. Chart Dataset 1: Monthly Transactions (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTxAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          volume: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format last 6 months bucket
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTransactions = [];
    const depositsVsWithdrawals = [];
    const customerGrowth = [];

    // Query deposits vs withdrawals monthly
    const depVsWithAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Query customer signups monthly
    const custGrowthAgg = await User.aggregate([
      { $match: { role: 'customer', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mNum = d.getMonth() + 1;
      const yNum = d.getFullYear();
      const mLabel = `${monthNames[d.getMonth()]} ${String(yNum).slice(-2)}`;

      // Match Monthly Transactions
      const txMatch = monthlyTxAgg.find(
        (item) => item._id.year === yNum && item._id.month === mNum
      );
      monthlyTransactions.push({
        month: mLabel,
        count: txMatch ? txMatch.count : 0,
        volume: txMatch ? Math.round(txMatch.volume * 100) / 100 : 0,
      });

      // Match Deposits vs Withdrawals
      const depMatch = depVsWithAgg.find(
        (item) => item._id.year === yNum && item._id.month === mNum && item._id.type === 'DEPOSIT'
      );
      const withMatch = depVsWithAgg.find(
        (item) => item._id.year === yNum && item._id.month === mNum && item._id.type === 'WITHDRAW'
      );
      depositsVsWithdrawals.push({
        month: mLabel,
        deposits: depMatch ? Math.round(depMatch.total * 100) / 100 : 0,
        withdrawals: withMatch ? Math.round(withMatch.total * 100) / 100 : 0,
      });

      // Match Customer Growth
      const custMatch = custGrowthAgg.find(
        (item) => item._id.year === yNum && item._id.month === mNum
      );
      customerGrowth.push({
        month: mLabel,
        newCustomers: custMatch ? custMatch.count : 0,
      });
    }

    // 3. Chart Dataset 4: Loan Statistics by Category
    const loanCategories = ['Personal', 'Education', 'Home', 'Vehicle'];
    const loanCategoryAgg = await Loan.aggregate([
      {
        $group: {
          _id: '$loanType',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const loanStatistics = loanCategories.map((type) => {
      const match = loanCategoryAgg.find((c) => c._id === type);
      return {
        loanType: type,
        count: match ? match.count : 0,
        totalAmount: match ? Math.round(match.amount * 100) / 100 : 0,
      };
    });

    // 4. Chart Dataset 5: Transaction Volume by Type
    const transactionVolume = [
      {
        type: 'Deposits',
        totalAmount: totalDeposits.amount,
        count: totalDeposits.count,
        fill: '#10B981', // emerald
      },
      {
        type: 'Withdrawals',
        totalAmount: totalWithdrawals.amount,
        count: totalWithdrawals.count,
        fill: '#F59E0B', // amber
      },
      {
        type: 'Transfers',
        totalAmount: totalTransfers.amount,
        count: totalTransfers.count,
        fill: '#6366F1', // indigo
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalCustomers,
          totalAccounts,
          totalDeposits,
          totalWithdrawals,
          totalTransfers,
          totalLoans,
          pendingLoans,
          pendingDepositRequests,
          pendingWithdrawalRequests,
          suspiciousTransactions: {
            count: suspiciousCount,
            recent: suspiciousTxList,
          },
        },
        metrics: {
          totalCustomers,
          totalAccounts,
          totalDeposits,
          totalWithdrawals,
          totalTransfers,
          totalLoans,
          pendingLoans,
          pendingDepositRequests,
          pendingWithdrawalRequests,
          suspiciousTransactions: {
            count: suspiciousCount,
            recent: suspiciousTxList,
          },
        },
        kpis: {
          totalCustomers,
          totalAccounts,
          totalDeposits,
          totalWithdrawals,
          totalTransfers,
          totalLoans,
          pendingLoans,
          suspiciousTransactions: {
            count: suspiciousCount,
            recent: suspiciousTxList,
          },
        },
        charts: {
          monthlyTransactions,
          depositsVsWithdrawals,
          customerGrowth,
          loanStatistics,
          transactionVolume,
        },
        recentSuspiciousTransactions: suspiciousTxList,
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with search, filter, and pagination
// @route   GET /api/admin/customers
// @access  Private (Admin)
const getAdminCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = { role: 'customer' };

    if (status !== undefined && status !== '') {
      if (['Active', 'Inactive', 'Frozen'].includes(status)) {
        query.status = status;
      } else {
        query.isActive = status === 'active' || status === 'true';
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { customerId: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach account counts for each customer
    const userIds = customers.map((c) => c._id);
    const accounts = await Account.find({ user: { $in: userIds } }).select('user status balance accountNumber accountType').lean();

    const customersWithAccounts = customers.map((c) => {
      const userAccounts = accounts.filter((a) => a.user.toString() === c._id.toString());
      return {
        ...c,
        accountsCount: userAccounts.length,
        accounts: userAccounts,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customers: customersWithAccounts,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin creates a new customer with auto-generated customerId and temporary credentials
// @route   POST /api/admin/customers
// @access  Private (Admin)
const createAdminCustomer = async (req, res, next) => {
  try {
    const { firstName, lastName, name, email, phone, initialDeposit = 0, address } = req.body;
    const fullName = name ? name.trim() : `${firstName || ''} ${lastName || ''}`.trim();

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone number are required to create a customer account.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Generate unique customerId (e.g., FIN-CUS-10025)
    const customerId = await User.generateCustomerId();

    // Generate secure temporary password
    const tempPassword = `Finova@${Math.floor(1000 + Math.random() * 9000)}`;

    // Create customer user
    const customer = await User.create({
      name: fullName,
      email: cleanEmail,
      phone: phone.trim(),
      password: tempPassword,
      role: 'customer',
      customerId,
      mustChangePassword: true,
      createdBy: req.user._id,
      status: 'Active',
      isActive: true,
      isVerified: true,
      address: address || {},
    });

    // Create default bank account
    let accountNumber = generateAccountNumber();
    let accExists = await Account.findOne({ accountNumber });
    while (accExists) {
      accountNumber = generateAccountNumber();
      accExists = await Account.findOne({ accountNumber });
    }

    const depositAmount = Math.max(0, Number(initialDeposit) || 0);

    const account = await Account.create({
      user: customer._id,
      accountNumber,
      accountType: 'Savings',
      balance: depositAmount,
      currency: 'INR',
      status: 'Active',
      dailyTransferLimit: 50000.0,
    });

    // If initial deposit > 0, create an audit deposit transaction
    if (depositAmount > 0) {
      await Transaction.create({
        user: customer._id,
        account: account._id,
        senderAccount: 'BRANCH-CASH-DEPOSIT',
        receiverAccount: accountNumber,
        type: 'DEPOSIT',
        amount: depositAmount,
        currency: 'INR',
        balanceAfter: depositAmount,
        status: 'COMPLETED',
        description: 'Initial deposit by Finova Admin during account creation',
        reference: `INIT-DEP-${Date.now()}`,
        transactionId: generateTransactionId ? generateTransactionId('DEP') : `TXN-DEP-${Date.now()}`,
      });
    }

    // Notification for the new customer
    await createNotification({
      user: customer._id,
      title: 'Welcome to Finova Digital Banking',
      message: `Your Finova customer account (${customerId}) has been provisioned. Please rotate your temporary password upon first login.`,
      type: 'ACCOUNT_ALERT',
    });

    // Send Welcome Email to customer
    emailService.sendWelcomeEmail({
      to: customer.email,
      name: customer.name,
      customerId: customer.customerId,
    }).catch((err) => {
      console.warn('[Admin] Notice: Welcome email delivery skipped or failed:', err.message);
    });

    // Audit log
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_CREATE_CUSTOMER',
      entity: 'User',
      entityId: customer._id,
      req,
      metadata: {
        customerId,
        email: customer.email,
        name: customer.name,
        accountNumber,
        initialDeposit: depositAmount,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      customer: {
        id: customer._id,
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        status: customer.status,
        isActive: customer.isActive,
        mustChangePassword: customer.mustChangePassword,
        createdAt: customer.createdAt,
      },
      temporaryPassword: tempPassword,
      account,
      credentials: {
        customerId: customer.customerId,
        email: customer.email,
        temporaryPassword: tempPassword,
        accountNumber: account.accountNumber,
        initialDeposit: depositAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete details of a customer by ID
// @route   GET /api/admin/customers/:id
// @access  Private (Admin)
const getAdminCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await User.findOne({ _id: id, role: 'customer' }).select('-password').lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const [accounts, loans, recentTransactions] = await Promise.all([
      Account.find({ user: customer._id }).lean(),
      Loan.find({ user: customer._id }).sort({ createdAt: -1 }).lean(),
      Transaction.find({ user: customer._id }).sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    res.status(200).json({
      success: true,
      customer,
      data: {
        customer,
        accounts,
        loans,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset customer password with a new temporary password
// @route   POST /api/admin/customers/:id/reset-password
// @access  Private (Admin)
const resetCustomerPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await User.findOne({ _id: id, role: 'customer' });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const tempPassword = `Finova@${Math.floor(1000 + Math.random() * 9000)}`;
    customer.password = tempPassword;
    customer.mustChangePassword = true;
    await customer.save();

    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_RESET_CUSTOMER_PASSWORD',
      entity: 'User',
      entityId: customer._id,
      req,
      metadata: {
        customerEmail: customer.email,
        customerId: customer.customerId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Temporary password generated successfully.',
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate or deactivate or freeze customer account
// @route   PUT /api/admin/customers/:id/status
// @access  Private (Admin)
const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const customer = await User.findOne({ _id: id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive', 'Frozen'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be Active, Inactive, or Frozen',
        });
      }
      customer.status = status;
      customer.isActive = status === 'Active';
    } else if (typeof isActive === 'boolean') {
      customer.isActive = isActive;
      customer.status = isActive ? 'Active' : 'Inactive';
    } else {
      return res.status(400).json({
        success: false,
        message: 'status or isActive is required',
      });
    }

    await customer.save();

    // Audit log ADMIN_CUSTOMER_STATUS event
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_CUSTOMER_STATUS',
      entity: 'User',
      entityId: customer._id,
      req,
      metadata: {
        customerEmail: customer.email,
        customerName: customer.name,
        customerId: customer.customerId,
        status: customer.status,
        isActive: customer.isActive,
      },
    });

    res.status(200).json({
      success: true,
      message: `Customer status updated to ${customer.status}`,
      customer: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        isActive: customer.isActive,
      },
      data: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bank accounts with search and filters
// @route   GET /api/admin/accounts
// @access  Private (Admin)
const getAdminAccounts = async (req, res, next) => {
  try {
    const { search, accountType, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (accountType && accountType !== 'ALL') {
      query.accountType = accountType;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Handle search by account number or customer name/email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { accountNumber: searchRegex },
        { user: { $in: userIds } },
      ];
    }

    const [accounts, total] = await Promise.all([
      Account.find(query)
        .populate('user', 'name email phone isVerified isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Account.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        accounts,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account status (Active, Frozen, Closed)
// @route   PUT /api/admin/accounts/:id/status
// @access  Private (Admin)
const updateAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Active', 'Frozen', 'Closed'];
    const normalizedStatus =
      status && allowedStatuses.find((s) => s.toLowerCase() === status.toLowerCase());

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: Active, Frozen, Closed',
      });
    }

    const account = await Account.findById(id).populate('user', 'name email');
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    account.status = normalizedStatus;
    await account.save();

    // Auto-trigger ACCOUNT notification
    if (account.user?._id || account.user) {
      const targetUserId = account.user._id || account.user;
      await createNotification({
        user: targetUserId,
        title: `Bank Account Status: ${normalizedStatus}`,
        message: `Your account #${account.accountNumber} (${account.accountType}) has been marked as ${normalizedStatus}.`,
        type: 'ACCOUNT',
      });
    }

    // Audit log ADMIN_ACCOUNT_STATUS event
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_ACCOUNT_STATUS',
      entity: 'Account',
      entityId: account._id,
      req,
      metadata: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        status: normalizedStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: `Account status updated to ${normalizedStatus}`,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all system transactions with filters
// @route   GET /api/admin/transactions
// @access  Private (Admin)
const getAdminTransactions = async (req, res, next) => {
  try {
    const { search, type, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (type && type !== 'ALL') {
      query.type = type.toUpperCase();
    }

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { transactionId: searchRegex },
        { senderAccount: searchRegex },
        { receiverAccount: searchRegex },
        { reference: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all loan applications with filters
// @route   GET /api/admin/loans
// @access  Private (Admin)
const getAdminLoans = async (req, res, next) => {
  try {
    const { status, loanType, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (loanType && loanType !== 'ALL') {
      query.loanType = loanType;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Loan.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        loans,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve loan application
// @route   PUT /api/admin/loans/:id/approve
// @access  Private (Admin)
const approveLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('user', 'name email phone');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    if (loan.status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Loan is already approved',
      });
    }

    loan.status = 'Approved';
    loan.approvedDate = new Date();
    await loan.save();

    // Auto-trigger LOAN notification
    if (loan.user?._id || loan.user) {
      await createNotification({
        user: loan.user._id || loan.user,
        title: 'Loan Approved!',
        message: `Congratulations! Your ${loan.loanType} loan application for ₹${(loan.amount || 0).toLocaleString('en-IN')} has been approved.`,
        type: 'LOAN',
      });
    }

    // Send Loan Approval Email
    if (loan.user && loan.user.email) {
      emailService.sendLoanStatusEmail({
        to: loan.user.email,
        name: loan.user.name,
        loan: {
          _id: loan._id,
          loanType: loan.loanType,
          status: 'APPROVED',
          amount: loan.amount,
          interestRate: loan.interestRate,
          termMonths: loan.termMonths,
          monthlyPayment: loan.monthlyPayment,
        },
        userPreferences: loan.user.emailPreferences,
      }).catch((err) => {
        console.warn('[Admin] Loan approval email dispatch skipped/failed:', err.message);
      });
    }

    // Audit log LOAN_APPROVE event
    await logAuditEvent({
      user: req.user._id,
      action: 'LOAN_APPROVE',
      entity: 'Loan',
      entityId: loan._id,
      req,
      metadata: {
        loanType: loan.loanType,
        amount: loan.amount,
        borrowerId: loan.user?._id || loan.user,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Loan application approved successfully',
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject loan application
// @route   PUT /api/admin/loans/:id/reject
// @access  Private (Admin)
const rejectLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const loan = await Loan.findById(id).populate('user', 'name email phone');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found',
      });
    }

    if (loan.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Loan is already rejected',
      });
    }

    loan.status = 'Rejected';
    loan.rejectedDate = new Date();
    await loan.save();

    // Auto-trigger LOAN notification
    if (loan.user?._id || loan.user) {
      await createNotification({
        user: loan.user._id || loan.user,
        title: 'Loan Application Update',
        message: `Your ${loan.loanType} loan application was not approved. Underwriting notes: ${reason || 'Criteria not met'}.`,
        type: 'LOAN',
      });
    }

    // Send Loan Rejection Email
    if (loan.user && loan.user.email) {
      emailService.sendLoanStatusEmail({
        to: loan.user.email,
        name: loan.user.name,
        loan: {
          _id: loan._id,
          loanType: loan.loanType,
          status: 'REJECTED',
          amount: loan.amount,
          interestRate: loan.interestRate,
          termMonths: loan.termMonths,
        },
        userPreferences: loan.user.emailPreferences,
      }).catch((err) => {
        console.warn('[Admin] Loan rejection email dispatch skipped/failed:', err.message);
      });
    }

    // Audit log LOAN_REJECT event
    await logAuditEvent({
      user: req.user._id,
      action: 'LOAN_REJECT',
      entity: 'Loan',
      entityId: loan._id,
      req,
      metadata: {
        loanType: loan.loanType,
        amount: loan.amount,
        reason: reason || 'Application does not meet credit underwriting criteria',
        borrowerId: loan.user?._id || loan.user,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Loan application rejected',
      data: loan,
      reason: reason || 'Application does not meet credit underwriting criteria',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fraud alerts with filtering, search, pagination & KPI stats
// @route   GET /api/admin/fraud-alerts
// @access  Private (Admin only)
const getAdminFraudAlerts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const { status, riskLevel, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (riskLevel && riskLevel !== 'ALL') {
      filter.riskLevel = riskLevel;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { senderAccount: { $regex: q, $options: 'i' } },
        { receiverAccount: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } },
        ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const [alerts, total, pendingCount, highRiskCount, resolvedCount] = await Promise.all([
      FraudAlert.find(filter)
        .populate('user', 'name email phone')
        .populate('transaction')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FraudAlert.countDocuments(filter),
      FraudAlert.countDocuments({ status: 'PENDING' }),
      FraudAlert.countDocuments({ riskLevel: 'HIGH' }),
      FraudAlert.countDocuments({ status: 'RESOLVED' }),
    ]);

    const totalAlerts = await FraudAlert.countDocuments();

    res.status(200).json({
      success: true,
      alerts,
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalAlerts,
        pendingCount,
        highRiskCount,
        resolvedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fraud alert details
// @route   GET /api/admin/fraud-alerts/:id
// @access  Private (Admin only)
const getAdminFraudAlertById = async (req, res, next) => {
  try {
    const alert = await FraudAlert.findById(req.params.id)
      .populate('user', 'name email phone role createdAt')
      .populate('transaction')
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Fraud alert not found',
      });
    }

    const [senderAccount, receiverAccount] = await Promise.all([
      Account.findOne({ accountNumber: alert.senderAccount }),
      Account.findOne({ accountNumber: alert.receiverAccount }).populate('user', 'name email'),
    ]);

    res.status(200).json({
      success: true,
      data: alert,
      accountDetails: {
        sender: senderAccount,
        receiver: receiverAccount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve a fraud alert (Approve/Release, Freeze Account, Reject/Refund)
// @route   PUT /api/admin/fraud-alerts/:id/resolve
// @access  Private (Admin only)
const resolveFraudAlert = async (req, res, next) => {
  try {
    const { action, notes } = req.body;
    const alert = await FraudAlert.findById(req.params.id).populate('transaction');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Fraud alert not found',
      });
    }

    const actionType = action || 'RELEASED';

    // 1. Release held transaction
    if (actionType === 'RELEASED') {
      if (alert.transaction && alert.transaction.status === 'HELD') {
        const txn = await Transaction.findById(alert.transaction._id);
        if (txn) {
          const receiverAcc = await Account.findOne({ accountNumber: txn.receiverAccount });
          if (receiverAcc) {
            receiverAcc.balance = parseFloat((receiverAcc.balance + txn.amount).toFixed(2));
            await receiverAcc.save();

            const receiverUserId = receiverAcc.user?._id || receiverAcc.user;
            if (receiverUserId) {
              const creditTxnId = generateTransactionId('TRF');
              await Transaction.create({
                transactionId: creditTxnId,
                user: receiverUserId,
                senderAccount: txn.senderAccount,
                receiverAccount: txn.receiverAccount,
                amount: txn.amount,
                type: 'TRANSFER',
                status: 'COMPLETED',
                description: `Released transfer from ${alert.senderAccount}`,
                reference: txn.reference,
                balanceAfter: receiverAcc.balance,
              });

              await createNotification({
                user: receiverUserId,
                title: 'Money Received',
                message: `Received ₹${txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from #${txn.senderAccount} following security verification clearance.`,
                type: 'TRANSFER',
              });
            }
          }

          txn.status = 'COMPLETED';
          txn.description = `[VERIFIED & RELEASED] ${txn.description.replace('[HELD - UNDER REVIEW] ', '')}`;
          await txn.save();
        }
      }

      await createNotification({
        user: alert.user,
        title: 'Transfer Cleared',
        message: `Your transfer of ₹${alert.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has passed security review and has been completed successfully.`,
        type: 'TRANSFER',
      });

      alert.actionTaken = 'RELEASED';
    } else if (actionType === 'ACCOUNT_FROZEN') {
      const senderAcc = await Account.findOne({ accountNumber: alert.senderAccount });
      if (senderAcc) {
        senderAcc.status = 'Frozen';
        await senderAcc.save();
      }

      await createNotification({
        user: alert.user,
        title: 'Security Notice: Account Temporarily Frozen',
        message: `Your account #${alert.senderAccount} has been temporarily frozen by fraud prevention due to suspicious activity.`,
        type: 'FRAUD',
      });

      alert.actionTaken = 'ACCOUNT_FROZEN';
    } else if (actionType === 'REJECTED') {
      if (alert.transaction && alert.transaction.status === 'HELD') {
        const txn = await Transaction.findById(alert.transaction._id);
        if (txn) {
          const senderAcc = await Account.findOne({ accountNumber: txn.senderAccount });
          if (senderAcc) {
            senderAcc.balance = parseFloat((senderAcc.balance + txn.amount).toFixed(2));
            await senderAcc.save();
          }
          txn.status = 'FAILED';
          txn.description = `[REJECTED BY COMPLIANCE] ${txn.description.replace('[HELD - UNDER REVIEW] ', '')}`;
          await txn.save();
        }
      }

      await createNotification({
        user: alert.user,
        title: 'Transfer Canceled by Security Desk',
        message: `Your transfer of ₹${alert.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} was rejected by institutional fraud prevention. Funds have been returned.`,
        type: 'FRAUD',
      });

      alert.actionTaken = 'REJECTED';
    } else {
      alert.actionTaken = 'REVIEWED';
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = notes?.trim() || `Resolved with action: ${actionType}`;
    await alert.save();

    // Audit log FRAUD_ALERT_RESOLVE event
    await logAuditEvent({
      user: req.user._id,
      action: 'FRAUD_ALERT_RESOLVE',
      entity: 'FraudAlert',
      entityId: alert._id,
      req,
      metadata: {
        actionTaken: actionType,
        senderAccount: alert.senderAccount,
        receiverAccount: alert.receiverAccount,
        amount: alert.amount,
        notes: alert.resolutionNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: `Fraud alert successfully resolved with action: ${actionType}`,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss a fraud alert (False positive)
// @route   PUT /api/admin/fraud-alerts/:id/dismiss
// @access  Private (Admin only)
const dismissFraudAlert = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const alert = await FraudAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Fraud alert not found',
      });
    }

    alert.status = 'DISMISSED';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = notes?.trim() || 'Dismissed as false positive after review';
    await alert.save();

    // Audit log FRAUD_ALERT_DISMISS event
    await logAuditEvent({
      user: req.user._id,
      action: 'FRAUD_ALERT_DISMISS',
      entity: 'FraudAlert',
      entityId: alert._id,
      req,
      metadata: {
        senderAccount: alert.senderAccount,
        receiverAccount: alert.receiverAccount,
        amount: alert.amount,
        notes: alert.resolutionNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Fraud alert dismissed as false positive',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs with search, filters, date range & pagination
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
const getAdminAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const { search, entity, action, startDate, endDate } = req.query;
    const filter = {};

    if (entity && entity !== 'ALL') {
      filter.entity = entity;
    }

    if (action && action !== 'ALL') {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { action: { $regex: q, $options: 'i' } },
        { entity: { $regex: q, $options: 'i' } },
        { ipAddress: { $regex: q, $options: 'i' } },
        ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const [logs, total, todayCount, securityCount, financialCount] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
      AuditLog.countDocuments({
        timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      AuditLog.countDocuments({
        action: { $in: ['USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGE', 'CARD_PIN_CHANGE', 'FRAUD_ALERT_RESOLVE', 'FRAUD_ALERT_DISMISS'] },
      }),
      AuditLog.countDocuments({
        action: { $in: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN_APPLY', 'LOAN_APPROVE'] },
      }),
    ]);

    const totalLogs = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalLogs,
        todayCount,
        securityCount,
        financialCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single audit log by ID
// @route   GET /api/admin/audit-logs/:id
// @access  Private (Admin only)
const getAdminAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'name email role phone createdAt')
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issued cards with search, filter, pagination
// @route   GET /api/admin/cards
// @access  Private (Admin)
const getAdminCards = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const users = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { customerId: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = users.map((u) => u._id);

      const accounts = await Account.find({
        accountNumber: { $regex: q, $options: 'i' },
      }).select('_id');
      const accountIds = accounts.map((a) => a._id);

      query.$or = [
        { lastFour: { $regex: q, $options: 'i' } },
        { cardType: { $regex: q, $options: 'i' } },
        { cardholderName: { $regex: q, $options: 'i' } },
        ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
        ...(accountIds.length > 0 ? [{ account: { $in: accountIds } }] : []),
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [cards, total, activeCount, blockedCount, pendingCount] = await Promise.all([
      Card.find(query)
        .populate('user', 'name email customerId phone')
        .populate('account', 'accountNumber accountType balance currency status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Card.countDocuments(query),
      Card.countDocuments({ status: 'Active' }),
      Card.countDocuments({ status: 'Blocked' }),
      Card.countDocuments({ status: 'Pending' }),
    ]);

    res.status(200).json({
      success: true,
      cards,
      data: {
        cards,
        stats: {
          total,
          activeCount,
          blockedCount,
          pendingCount,
        },
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin issues a virtual debit card for a customer
// @route   POST /api/admin/cards
// @access  Private (Admin)
const issueAdminCard = async (req, res, next) => {
  try {
    const { userId, customerId, accountId, accountNumber, cardType, pin, transactionLimit } = req.body;

    // Find customer
    let customer;
    if (userId) {
      customer = await User.findById(userId);
    } else if (customerId) {
      customer = await User.findOne({ customerId: customerId.toUpperCase().trim() });
    }

    // Find account
    let account;
    if (accountId) {
      account = await Account.findById(accountId);
    } else if (accountNumber) {
      account = await Account.findOne({ accountNumber: accountNumber.trim() });
    }

    if (!customer && account) {
      customer = await User.findById(account.user);
    }

    if (!account && customer) {
      account = await Account.findOne({ user: customer._id, status: 'Active' });
      if (!account) {
        account = await Account.getOrCreateUserAccount(customer._id);
      }
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found. Please provide a valid customerId or account.',
      });
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'No bank account found for this customer.',
      });
    }

    // Generate random 4-digit PIN if not provided
    const cardPin = (pin && /^\d{4}$/.test(pin)) ? pin : String(Math.floor(1000 + Math.random() * 9000));
    const hashedPin = await Card.hashPin(cardPin);

    // Random last 4
    const randomLastFour = Math.floor(1000 + Math.random() * 9000).toString();
    const isMastercard = cardType && cardType.toLowerCase().includes('mastercard');
    const prefix = isMastercard ? '5412' : '4532';
    const maskedCardNumber = `${prefix} •••• •••• ${randomLastFour}`;

    // Expiry: 4 years
    const now = new Date();
    const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expiryYear = String((now.getFullYear() + 4) % 100).padStart(2, '0');
    const expiryDate = `${expiryMonth}/${expiryYear}`;

    const limit = transactionLimit ? Number(transactionLimit) : 50000;

    const card = await Card.create({
      user: customer._id,
      account: account._id,
      maskedCardNumber,
      lastFour: randomLastFour,
      cardType: cardType || 'Visa Platinum Debit',
      cardholderName: customer.name,
      expiryDate,
      pin: hashedPin,
      status: 'Active',
      transactionLimit: limit,
    });

    await card.populate('user', 'name email customerId phone');
    await card.populate('account', 'accountNumber accountType balance currency status');

    // Notify customer
    await createNotification({
      user: customer._id,
      title: 'New Virtual Card Issued',
      message: `Finova Administrator has issued a new ${card.cardType} (ending in ${randomLastFour}) linked to account #${account.accountNumber}. Default PIN: ${cardPin}.`,
      type: 'CARD',
    });

    // Audit log
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_CARD_ISSUE',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        customerId: customer.customerId,
        accountNumber: account.accountNumber,
        cardType: card.cardType,
        lastFour: card.lastFour,
        limit,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Virtual debit card issued successfully!',
      card,
      issuedPin: cardPin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin block / activate customer card
// @route   PUT /api/admin/cards/:id/status
// @access  Private (Admin)
const updateAdminCardStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Blocked', 'Inactive', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Active, Blocked, Inactive, or Pending',
      });
    }

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    const previousStatus = card.status;
    card.status = status;
    await card.save();

    await card.populate('user', 'name email customerId');
    await card.populate('account', 'accountNumber');

    // Build customer notification message based on transition type
    let notifTitle, notifMessage;
    if (previousStatus === 'Pending' && status === 'Active') {
      notifTitle = '🎉 Your Card Has Been Issued!';
      notifMessage = `Great news! Your debit card application (${card.cardType} ending in ${card.lastFour}) has been approved and issued by Finova Administration. Your card is now active and ready to use.`;
    } else {
      notifTitle = `Card ${status}`;
      notifMessage = `Your debit card ending in ${card.lastFour} has been updated to "${status}" by Finova Administration.`;
    }

    // Notify customer
    await createNotification({
      user: card.user._id,
      title: notifTitle,
      message: notifMessage,
      type: 'CARD',
    });

    // Audit log
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_CARD_STATUS',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        cardId: card._id,
        lastFour: card.lastFour,
        previousStatus,
        status,
        issuedFromApplication: previousStatus === 'Pending' && status === 'Active',
      },
    });

    res.status(200).json({
      success: true,
      message: previousStatus === 'Pending' && status === 'Active'
        ? `Card successfully issued and activated for ${card.user?.name || 'customer'}`
        : `Card status updated to ${status}`,
      card,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin adjust customer card transaction limit
// @route   PUT /api/admin/cards/:id/limit
// @access  Private (Admin)
const updateAdminCardLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionLimit } = req.body;

    const numLimit = Number(transactionLimit);
    if (isNaN(numLimit) || numLimit < 100 || numLimit > 500000) {
      return res.status(400).json({
        success: false,
        message: 'Transaction limit must be between ₹100.00 and ₹5,00,000.00',
      });
    }

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    card.transactionLimit = numLimit;
    await card.save();

    await card.populate('user', 'name email customerId');

    // Audit log
    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_CARD_LIMIT',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        cardId: card._id,
        lastFour: card.lastFour,
        newLimit: numLimit,
      },
    });

    res.status(200).json({
      success: true,
      message: `Daily transaction limit updated to ₹${numLimit.toLocaleString('en-IN')}`,
      card,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAdminCustomers,
  createAdminCustomer,
  getAdminCustomerById,
  resetCustomerPassword,
  updateCustomerStatus,
  getAdminAccounts,
  updateAccountStatus,
  getAdminCards,
  issueAdminCard,
  updateAdminCardStatus,
  updateAdminCardLimit,
  getAdminTransactions,
  getAdminLoans,
  approveLoan,
  rejectLoan,
  getAdminFraudAlerts,
  getAdminFraudAlertById,
  resolveFraudAlert,
  dismissFraudAlert,
  getAdminAuditLogs,
  getAdminAuditLogById,
};
