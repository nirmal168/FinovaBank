const mongoose = require('mongoose');
const DepositWithdrawalRequest = require('../models/DepositWithdrawalRequest');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { creditAccount, debitAccount } = require('../services/accountBalanceService');
const generateTransactionId = require('../utils/generateTransactionId');
const { createNotification } = require('../utils/notificationService');
const { logAuditEvent } = require('../utils/auditLogger');
const emailService = require('../services/emailService');

// ==========================================
// CUSTOMER CONTROLLER METHODS
// ==========================================

/**
 * @desc    Submit a new Deposit or Withdrawal request
 * @route   POST /api/deposit-withdrawal-requests
 * @access  Private (Customer only)
 */
const createRequest = async (req, res, next) => {
  try {
    const { accountId, accountNumber, type, amount, description } = req.body;

    // 1. Validate request type
    const normalizedType = type ? type.toUpperCase().trim() : '';
    if (!['DEPOSIT', 'WITHDRAWAL'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type. Must be either DEPOSIT or WITHDRAWAL.',
      });
    }

    // 2. Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0.',
      });
    }

    // 3. Resolve target account & verify ownership (Customer can only use their own account)
    let account;
    if (accountId) {
      account = await Account.findById(accountId);
    } else if (accountNumber) {
      account = await Account.findOne({ accountNumber: accountNumber.trim() });
    } else {
      account = await Account.getOrCreateUserAccount(req.user._id);
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Target bank account not found.',
      });
    }

    // Strict IDOR Ownership Verification: account must belong to authenticated customer
    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to submit requests for this account.',
      });
    }

    // 4. Verify account status
    if (account.status.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${account.status.toLowerCase()}. Requests are not permitted.`,
      });
    }

    // 5. Withdrawal validation: check available balance at request time
    if (normalizedType === 'WITHDRAWAL' && account.balance < numericAmount) {
      const formattedBal = account.balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      });
      const formattedReq = numericAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      });
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available funds: ₹${formattedBal}, Requested: ₹${formattedReq}.`,
      });
    }

    // 6. Generate unique request identifier (e.g. FIN-REQ-10021)
    const requestId = await DepositWithdrawalRequest.generateRequestId();

    // 7. Persist request with PENDING status (Customer balance remains untouched)
    const newRequest = await DepositWithdrawalRequest.create({
      requestId,
      user: req.user._id,
      account: account._id,
      type: normalizedType,
      amount: numericAmount,
      currency: 'INR',
      description: description?.trim() || '',
      status: 'PENDING',
      requestedAt: new Date(),
    });

    // 8. Audit event
    await logAuditEvent({
      req,
      user: req.user._id,
      action: `CUSTOMER_SUBMITTED_${normalizedType}_REQUEST`,
      entity: 'DepositWithdrawalRequest',
      entityId: newRequest._id,
      metadata: {
        requestId: newRequest.requestId,
        type: normalizedType,
        amount: numericAmount,
        accountId: account._id,
        accountNumber: account.accountNumber,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Your request has been submitted for admin approval.',
      request: {
        _id: newRequest._id,
        requestId: newRequest.requestId,
        account: {
          _id: account._id,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
        },
        amount: newRequest.amount,
        currency: newRequest.currency,
        type: newRequest.type,
        status: newRequest.status,
        description: newRequest.description,
        requestedAt: newRequest.requestedAt,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's own deposit & withdrawal requests
 * @route   GET /api/deposit-withdrawal-requests
 * @access  Private (Customer only)
 */
const getMyRequests = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (type && type.toUpperCase() !== 'ALL') {
      filter.type = type.toUpperCase();
    }
    if (status && status.toUpperCase() !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      DepositWithdrawalRequest.find(filter)
        .populate('account', 'accountNumber accountType balance status currency')
        .populate('transaction', 'transactionId status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DepositWithdrawalRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of a single request
 * @route   GET /api/deposit-withdrawal-requests/:id
 * @access  Private (Customer - own request only, or Admin)
 */
const getRequestById = async (req, res, next) => {
  try {
    const request = await DepositWithdrawalRequest.findById(req.params.id)
      .populate('user', 'name email customerId phone')
      .populate('account', 'accountNumber accountType balance status currency')
      .populate('processedBy', 'name customerId')
      .populate('transaction');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Deposit/Withdrawal request not found.',
      });
    }

    // Ownership check: must be owner or admin
    if (
      request.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this request.',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a pending request
 * @route   PUT /api/deposit-withdrawal-requests/:id/cancel
 * @access  Private (Customer - own pending request only)
 */
const cancelRequest = async (req, res, next) => {
  try {
    const request = await DepositWithdrawalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Deposit/Withdrawal request not found.',
      });
    }

    // Ownership check
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only cancel your own requests.',
      });
    }

    // Status check
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING requests can be cancelled. Current status is ${request.status}.`,
      });
    }

    request.status = 'CANCELLED';
    await request.save();

    await logAuditEvent({
      req,
      user: req.user._id,
      action: 'CUSTOMER_CANCELLED_REQUEST',
      entity: 'DepositWithdrawalRequest',
      entityId: request._id,
      metadata: {
        requestId: request.requestId,
        type: request.type,
        amount: request.amount,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Your request has been successfully cancelled.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN CONTROLLER METHODS
// ==========================================

/**
 * @desc    Get all deposit and withdrawal requests with filters and summary stats
 * @route   GET /api/admin/deposit-withdrawal-requests
 * @access  Private (Admin only)
 */
const getAdminRequests = async (req, res, next) => {
  try {
    const {
      type,
      status,
      dateRange,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const filter = {};

    // 1. Type filter
    if (type && type.toUpperCase() !== 'ALL') {
      filter.type = type.toUpperCase();
    }

    // 2. Status filter
    if (status && status.toUpperCase() !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    // 3. Date Range filter
    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      filter.requestedAt = { $gte: startOfDay };
    } else if (dateRange === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.requestedAt = { $gte: pastWeek };
    } else if (dateRange === 'month') {
      const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filter.requestedAt = { $gte: pastMonth };
    } else if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.requestedAt.$lte = end;
      }
    }

    // 4. Search filter: search in requestId or find matching user/account ids
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      const [matchingUsers, matchingAccounts] = await Promise.all([
        User.find({
          $or: [{ name: searchRegex }, { customerId: searchRegex }, { email: searchRegex }],
        }).select('_id'),
        Account.find({ accountNumber: searchRegex }).select('_id'),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const accountIds = matchingAccounts.map((a) => a._id);

      filter.$or = [
        { requestId: searchRegex },
        { user: { $in: userIds } },
        { account: { $in: accountIds } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    // 5. Query requests and calculate Institutional KPI Summary
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [
      requests,
      total,
      pendingDeposits,
      pendingWithdrawals,
      approvedTodayAgg,
      rejectedToday,
      totalDepositAgg,
      totalWithdrawalAgg,
    ] = await Promise.all([
      DepositWithdrawalRequest.find(filter)
        .populate('user', 'name customerId email phone')
        .populate('account', 'accountNumber accountType balance status currency')
        .populate('processedBy', 'name customerId email')
        .populate('transaction', 'transactionId status createdAt')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DepositWithdrawalRequest.countDocuments(filter),

      // Summary KPIs:
      DepositWithdrawalRequest.countDocuments({ type: 'DEPOSIT', status: 'PENDING' }),
      DepositWithdrawalRequest.countDocuments({ type: 'WITHDRAWAL', status: 'PENDING' }),

      // Approved Today amount
      DepositWithdrawalRequest.aggregate([
        {
          $match: {
            status: 'APPROVED',
            processedAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Rejected Today count
      DepositWithdrawalRequest.countDocuments({
        status: 'REJECTED',
        processedAt: { $gte: startOfToday },
      }),

      // Total Deposit Amount (Approved all-time)
      DepositWithdrawalRequest.aggregate([
        { $match: { type: 'DEPOSIT', status: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total Withdrawal Amount (Approved all-time)
      DepositWithdrawalRequest.aggregate([
        { $match: { type: 'WITHDRAWAL', status: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const summary = {
      pendingDeposits,
      pendingWithdrawals,
      approvedToday: approvedTodayAgg[0]?.total || 0,
      rejectedToday,
      totalDepositAmount: totalDepositAgg[0]?.total || 0,
      totalWithdrawalAmount: totalWithdrawalAgg[0]?.total || 0,
    };

    res.status(200).json({
      success: true,
      summary,
      count: requests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single deposit/withdrawal request details for Admin
 * @route   GET /api/admin/deposit-withdrawal-requests/:id
 * @access  Private (Admin only)
 */
const getAdminRequestById = async (req, res, next) => {
  try {
    const request = await DepositWithdrawalRequest.findById(req.params.id)
      .populate('user', 'name customerId email phone address profileImage')
      .populate('account', 'accountNumber accountType balance status currency')
      .populate('processedBy', 'name customerId email')
      .populate('transaction');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Deposit/Withdrawal request not found.',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a Deposit or Withdrawal request
 * @route   POST /api/admin/deposit-withdrawal-requests/:id/approve
 * @access  Private (Admin only)
 */
const approveRequest = async (req, res, next) => {
  let session = null;
  let sessionStarted = false;

  try {
    const { adminNote } = req.body;

    // 1. Double Approval Protection: Ensure request exists and is PENDING
    const targetRequest = await DepositWithdrawalRequest.findById(req.params.id)
      .populate('user')
      .populate('account');

    if (!targetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Deposit/Withdrawal request not found.',
      });
    }

    if (targetRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      });
    }

    const customer = targetRequest.user;
    const account = targetRequest.account;

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Associated customer account not found.',
      });
    }

    // 2. Account active validation
    if (account.status.toLowerCase() !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Account is ${account.status.toLowerCase()}. Cannot approve request.`,
      });
    }

    // 3. Re-verify available balance for WITHDRAWAL at approval time
    if (targetRequest.type === 'WITHDRAWAL' && account.balance < targetRequest.amount) {
      const formattedBal = account.balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      });
      const formattedReq = targetRequest.amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      });
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. This withdrawal cannot be approved. Available funds: ₹${formattedBal}, Requested: ₹${formattedReq}.`,
      });
    }

    // 4. Try establishing MongoDB transaction session (with fallback for standalone instances)
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      sessionStarted = true;
    } catch (e) {
      session = null;
      sessionStarted = false;
    }

    let updatedRequest = null;
    let balanceResult = null;
    let createdTransaction = null;

    try {
      // 5. Atomic state update on request to lock against concurrent approvals
      const atomicOptions = sessionStarted && session ? { session, new: true } : { new: true };

      updatedRequest = await DepositWithdrawalRequest.findOneAndUpdate(
        { _id: targetRequest._id, status: 'PENDING' },
        {
          status: 'APPROVED',
          processedBy: req.user._id,
          processedAt: new Date(),
          adminNote: adminNote?.trim() || '',
        },
        atomicOptions
      );

      if (!updatedRequest) {
        if (sessionStarted && session) await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'This request has already been processed.',
        });
      }

      // 6. Mutate account balance through centralized accountBalanceService
      if (targetRequest.type === 'DEPOSIT') {
        balanceResult = await creditAccount({
          accountId: account._id,
          amount: targetRequest.amount,
          session: sessionStarted ? session : null,
        });
      } else {
        balanceResult = await debitAccount({
          accountId: account._id,
          amount: targetRequest.amount,
          session: sessionStarted ? session : null,
        });
      }

      // 7. Create immutable Transaction record
      const isDeposit = targetRequest.type === 'DEPOSIT';
      const txnPrefix = isDeposit ? 'DEP' : 'WDL';
      const transactionId = generateTransactionId(txnPrefix);

      const txnData = {
        transactionId,
        user: customer._id,
        senderAccount: isDeposit ? 'EXTERNAL-DEPOSIT' : account.accountNumber,
        receiverAccount: isDeposit ? account.accountNumber : 'EXTERNAL-WITHDRAWAL',
        amount: targetRequest.amount,
        currency: 'INR',
        type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
        status: 'COMPLETED',
        description:
          targetRequest.description?.trim() ||
          `Admin approved ${isDeposit ? 'cash deposit' : 'cash withdrawal'}`,
        reference: `REQ-${targetRequest.requestId}`,
        balanceAfter: balanceResult.newBalance,
        processedBy: req.user._id,
        requestId: targetRequest.requestId,
      };

      if (sessionStarted && session) {
        const [savedTx] = await Transaction.create([txnData], { session });
        createdTransaction = savedTx;
      } else {
        createdTransaction = await Transaction.create(txnData);
      }

      // 8. Associate transaction with request
      updatedRequest.transaction = createdTransaction._id;
      if (sessionStarted && session) {
        await updatedRequest.save({ session });
        await session.commitTransaction();
      } else {
        await updatedRequest.save();
      }
    } catch (txErr) {
      if (
        sessionStarted &&
        session &&
        txErr.message &&
        (txErr.message.includes('Transaction numbers are only allowed on a replica set member') ||
          txErr.message.includes('replica set'))
      ) {
        // Standalone mongod detected: abort session and execute sequentially
        await session.abortTransaction();
        session.endSession();
        session = null;
        sessionStarted = false;

        updatedRequest = await DepositWithdrawalRequest.findOneAndUpdate(
          { _id: targetRequest._id, status: 'PENDING' },
          {
            status: 'APPROVED',
            processedBy: req.user._id,
            processedAt: new Date(),
            adminNote: adminNote?.trim() || '',
          },
          { new: true }
        );

        if (!updatedRequest) {
          return res.status(409).json({
            success: false,
            message: 'This request has already been processed.',
          });
        }

        if (targetRequest.type === 'DEPOSIT') {
          balanceResult = await creditAccount({
            accountId: account._id,
            amount: targetRequest.amount,
          });
        } else {
          balanceResult = await debitAccount({
            accountId: account._id,
            amount: targetRequest.amount,
          });
        }

        const isDeposit = targetRequest.type === 'DEPOSIT';
        const txnPrefix = isDeposit ? 'DEP' : 'WDL';
        const transactionId = generateTransactionId(txnPrefix);

        createdTransaction = await Transaction.create({
          transactionId,
          user: customer._id,
          senderAccount: isDeposit ? 'EXTERNAL-DEPOSIT' : account.accountNumber,
          receiverAccount: isDeposit ? account.accountNumber : 'EXTERNAL-WITHDRAWAL',
          amount: targetRequest.amount,
          currency: 'INR',
          type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
          status: 'COMPLETED',
          description:
            targetRequest.description?.trim() ||
            `Admin approved ${isDeposit ? 'cash deposit' : 'cash withdrawal'}`,
          reference: `REQ-${targetRequest.requestId}`,
          balanceAfter: balanceResult.newBalance,
          processedBy: req.user._id,
          requestId: targetRequest.requestId,
        });

        updatedRequest.transaction = createdTransaction._id;
        await updatedRequest.save();
      } else {
        if (sessionStarted && session) {
          await session.abortTransaction();
        }
        throw txErr;
      }
    } finally {
      if (sessionStarted && session) {
        session.endSession();
      }
    }

    // 9. Create Customer In-App Notification
    const formattedAmount = `₹${targetRequest.amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;

    const notificationMessage =
      targetRequest.type === 'DEPOSIT'
        ? `Your deposit request of ${formattedAmount} has been approved and credited to your account.`
        : `Your withdrawal request of ${formattedAmount} has been approved and debited from your account.`;

    await createNotification({
      user: customer._id,
      title: `${targetRequest.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Request Approved`,
      message: notificationMessage,
      type: targetRequest.type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
    });

    // 10. Send Email Notification asynchronously (non-blocking, failures do not roll back financial approval)
    emailService
      .sendDepositWithdrawalEmail({
        to: customer.email,
        name: customer.name,
        request: updatedRequest,
        account,
        transaction: createdTransaction,
      })
      .catch((mailErr) => {
        console.warn(
          `[DepositWithdrawal] Notification email skipped/failed for ${customer.email}:`,
          mailErr.message
        );
      });

    // 11. Institutional Audit Log
    await logAuditEvent({
      req,
      user: req.user._id,
      action:
        targetRequest.type === 'DEPOSIT'
          ? 'ADMIN_APPROVED_DEPOSIT'
          : 'ADMIN_APPROVED_WITHDRAWAL',
      entity: 'DepositWithdrawalRequest',
      entityId: updatedRequest._id,
      metadata: {
        adminId: req.user._id,
        requestId: targetRequest.requestId,
        customerId: customer.customerId || customer._id,
        accountId: account._id,
        accountNumber: account.accountNumber,
        amount: targetRequest.amount,
        transactionId: createdTransaction.transactionId,
        previousBalance: balanceResult.previousBalance,
        newBalance: balanceResult.newBalance,
        adminNote: adminNote || '',
      },
    });

    res.status(200).json({
      success: true,
      message: `${targetRequest.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} request approved successfully.`,
      request: updatedRequest,
      transaction: createdTransaction,
      newBalance: balanceResult.newBalance,
    });
  } catch (error) {
    if (sessionStarted && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Reject a Deposit or Withdrawal request
 * @route   POST /api/admin/deposit-withdrawal-requests/:id/reject
 * @access  Private (Admin only)
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { adminNote, reason } = req.body;
    const rejectionReason = (adminNote || reason || '').trim();

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Admin processing note / rejection reason is required.',
      });
    }

    // Double Processing Protection
    const targetRequest = await DepositWithdrawalRequest.findById(req.params.id)
      .populate('user')
      .populate('account');

    if (!targetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Deposit/Withdrawal request not found.',
      });
    }

    if (targetRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      });
    }

    // Atomic update status to REJECTED
    const updatedRequest = await DepositWithdrawalRequest.findOneAndUpdate(
      { _id: targetRequest._id, status: 'PENDING' },
      {
        status: 'REJECTED',
        processedBy: req.user._id,
        processedAt: new Date(),
        adminNote: rejectionReason,
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(409).json({
        success: false,
        message: 'This request has already been processed.',
      });
    }

    const customer = targetRequest.user;
    const account = targetRequest.account;
    const formattedAmount = `₹${targetRequest.amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;

    // Create In-App Notification
    const notificationMessage =
      targetRequest.type === 'DEPOSIT'
        ? `Your deposit request of ${formattedAmount} was rejected. Reason: ${rejectionReason}`
        : `Your withdrawal request of ${formattedAmount} was rejected. Reason: ${rejectionReason}`;

    await createNotification({
      user: customer._id,
      title: `${targetRequest.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Request Rejected`,
      message: notificationMessage,
      type: targetRequest.type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
    });

    // Send Rejection Email Notification
    emailService
      .sendDepositWithdrawalEmail({
        to: customer.email,
        name: customer.name,
        request: updatedRequest,
        account,
        transaction: null,
      })
      .catch((mailErr) => {
        console.warn(
          `[DepositWithdrawal] Rejection email skipped/failed for ${customer.email}:`,
          mailErr.message
        );
      });

    // Institutional Audit Log
    await logAuditEvent({
      req,
      user: req.user._id,
      action:
        targetRequest.type === 'DEPOSIT'
          ? 'ADMIN_REJECTED_DEPOSIT'
          : 'ADMIN_REJECTED_WITHDRAWAL',
      entity: 'DepositWithdrawalRequest',
      entityId: updatedRequest._id,
      metadata: {
        adminId: req.user._id,
        requestId: targetRequest.requestId,
        customerId: customer.customerId || customer._id,
        accountId: account?._id,
        accountNumber: account?.accountNumber,
        amount: targetRequest.amount,
        rejectionReason,
      },
    });

    res.status(200).json({
      success: true,
      message: `${targetRequest.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} request rejected.`,
      request: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getAdminRequests,
  getAdminRequestById,
  approveRequest,
  rejectRequest,
};
