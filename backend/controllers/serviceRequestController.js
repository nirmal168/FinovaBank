const { ChequeBookRequest, PassbookRequest } = require('../models/ServiceRequest');
const Account = require('../models/Account');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Apply for a new cheque book
// @route   POST /api/service-requests/cheque-books
// @access  Private (Customer)
exports.applyChequeBook = async (req, res, next) => {
  try {
    const { accountId, numberOfLeaves, deliveryAddress } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required to apply for a cheque book',
      });
    }

    // Verify account exists and belongs to the customer
    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found or access denied',
      });
    }

    if (account.status === 'Closed' || account.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a cheque book for a closed account',
      });
    }

    // Check if there is already a Pending request for this account
    const existingPending = await ChequeBookRequest.findOne({
      user: req.user._id,
      account: account._id,
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending cheque book request for this account. Please wait for admin processing.',
      });
    }

    const leaves = [20, 25, 50, 100].includes(Number(numberOfLeaves)) ? Number(numberOfLeaves) : 25;

    const address = deliveryAddress || {
      street: req.user.address?.street || '',
      city: req.user.address?.city || '',
      state: req.user.address?.state || '',
      postalCode: req.user.address?.postalCode || '',
      country: req.user.address?.country || 'India',
    };

    const request = await ChequeBookRequest.create({
      user: req.user._id,
      account: account._id,
      numberOfLeaves: leaves,
      accountType: account.accountType,
      deliveryAddress: address,
      status: 'Pending',
    });

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: 'Cheque Book Application Submitted',
      message: `Your request for a ${leaves}-leaf Cheque Book for Account #${account.accountNumber} has been received and is awaiting admin approval.`,
      type: 'SERVICE',
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CHEQUE_BOOK_APPLY',
      entity: 'ChequeBookRequest',
      entityId: request._id.toString(),
      metadata: { accountId: account._id, accountNumber: account.accountNumber, leaves },
    });

    res.status(201).json({
      success: true,
      message: 'Cheque book application submitted successfully. It will be reviewed and issued by bank administration.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's cheque book requests
// @route   GET /api/service-requests/cheque-books
// @access  Private (Customer)
exports.getCustomerChequeBooks = async (req, res, next) => {
  try {
    const requests = await ChequeBookRequest.find({ user: req.user._id })
      .populate('account', 'accountNumber accountType balance status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply for a passbook
// @route   POST /api/service-requests/passbooks
// @access  Private (Customer)
exports.applyPassbook = async (req, res, next) => {
  try {
    const { accountId, requestType, deliveryAddress } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required to apply for a passbook',
      });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found or access denied',
      });
    }

    if (account.status === 'Closed' || account.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a passbook for a closed account',
      });
    }

    const existingPending = await PassbookRequest.findOne({
      user: req.user._id,
      account: account._id,
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending passbook request for this account. Please wait for admin processing.',
      });
    }

    const type = ['New Passbook', 'Renewal / Full', 'Duplicate / Lost'].includes(requestType)
      ? requestType
      : 'New Passbook';

    const address = deliveryAddress || {
      street: req.user.address?.street || '',
      city: req.user.address?.city || '',
      state: req.user.address?.state || '',
      postalCode: req.user.address?.postalCode || '',
      country: req.user.address?.country || 'India',
    };

    const request = await PassbookRequest.create({
      user: req.user._id,
      account: account._id,
      requestType: type,
      accountType: account.accountType,
      deliveryAddress: address,
      status: 'Pending',
    });

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: 'Passbook Request Submitted',
      message: `Your application for a (${type}) for Account #${account.accountNumber} has been received and is pending admin approval and issuance.`,
      type: 'SERVICE',
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'PASSBOOK_APPLY',
      entity: 'PassbookRequest',
      entityId: request._id.toString(),
      metadata: { accountId: account._id, accountNumber: account.accountNumber, requestType: type },
    });

    res.status(201).json({
      success: true,
      message: 'Passbook request submitted successfully. It will be reviewed and issued by bank administration.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's passbook requests
// @route   GET /api/service-requests/passbooks
// @access  Private (Customer)
exports.getCustomerPassbooks = async (req, res, next) => {
  try {
    const requests = await PassbookRequest.find({ user: req.user._id })
      .populate('account', 'accountNumber accountType balance status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN CONTROLLERS: REVIEW & ISSUE REQUESTS
// ==========================================

// @desc    Get all cheque book requests with stats
// @route   GET /api/admin/service-requests/cheque-books
// @access  Private (Admin)
exports.getAdminChequeBooks = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total, pendingCount, issuedCount, rejectedCount] = await Promise.all([
      ChequeBookRequest.find(query)
        .populate('user', 'name email customerId phone')
        .populate('account', 'accountNumber accountType balance status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ChequeBookRequest.countDocuments(query),
      ChequeBookRequest.countDocuments({ status: 'Pending' }),
      ChequeBookRequest.countDocuments({ status: 'Issued' }),
      ChequeBookRequest.countDocuments({ status: 'Rejected' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
          total,
        },
        stats: {
          total: pendingCount + issuedCount + rejectedCount,
          pendingCount,
          issuedCount,
          rejectedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve / Issue / Reject a cheque book request
// @route   PUT /api/admin/service-requests/cheque-books/:id
// @access  Private (Admin)
exports.processChequeBook = async (req, res, next) => {
  try {
    const { status, chequeBookSeries, adminNotes } = req.body;

    if (!['Approved', 'Issued', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved, Issued, or Rejected',
      });
    }

    const request = await ChequeBookRequest.findById(req.params.id)
      .populate('user', 'name email customerId')
      .populate('account', 'accountNumber');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Cheque book request not found',
      });
    }

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    request.processedBy = req.user._id;

    if (status === 'Issued') {
      request.issuedAt = new Date();
      if (chequeBookSeries) {
        request.chequeBookSeries = chequeBookSeries;
      } else if (!request.chequeBookSeries) {
        // Auto-generate realistic cheque book series numbers
        const randStart = Math.floor(100000 + Math.random() * 900000);
        const randEnd = randStart + (request.numberOfLeaves - 1);
        request.chequeBookSeries = `CHQ-${randStart} to CHQ-${randEnd}`;
      }
    }

    await request.save();

    // Create notification for customer
    let notifTitle = 'Cheque Book Update';
    let notifMessage = `Your cheque book request for account #${request.account?.accountNumber || ''} is now marked as ${status}.`;

    if (status === 'Issued') {
      notifTitle = '?? Cheque Book Issued!';
      notifMessage = `Your ${request.numberOfLeaves}-leaf Cheque Book (${request.chequeBookSeries}) has been officially issued and dispatched to your address.`;
    } else if (status === 'Rejected') {
      notifTitle = 'Cheque Book Request Declined';
      notifMessage = `Your cheque book application was declined. Note: ${adminNotes || 'Account criteria unfulfilled'}`;
    }

    await Notification.create({
      user: request.user._id,
      title: notifTitle,
      message: notifMessage,
      type: 'SERVICE',
    });

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: `CHEQUE_BOOK_${status.toUpperCase()}`,
      entity: 'ChequeBookRequest',
      entityId: request._id.toString(),
      metadata: {
        customerId: request.user._id,
        status,
        series: request.chequeBookSeries,
        adminNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: `Cheque book request successfully ${status.toLowerCase()}`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all passbook requests with stats
// @route   GET /api/admin/service-requests/passbooks
// @access  Private (Admin)
exports.getAdminPassbooks = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total, pendingCount, issuedCount, rejectedCount] = await Promise.all([
      PassbookRequest.find(query)
        .populate('user', 'name email customerId phone')
        .populate('account', 'accountNumber accountType balance status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PassbookRequest.countDocuments(query),
      PassbookRequest.countDocuments({ status: 'Pending' }),
      PassbookRequest.countDocuments({ status: 'Issued' }),
      PassbookRequest.countDocuments({ status: 'Rejected' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
          total,
        },
        stats: {
          total: pendingCount + issuedCount + rejectedCount,
          pendingCount,
          issuedCount,
          rejectedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve / Issue / Reject a passbook request
// @route   PUT /api/admin/service-requests/passbooks/:id
// @access  Private (Admin)
exports.processPassbook = async (req, res, next) => {
  try {
    const { status, passbookNumber, adminNotes } = req.body;

    if (!['Approved', 'Issued', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved, Issued, or Rejected',
      });
    }

    const request = await PassbookRequest.findById(req.params.id)
      .populate('user', 'name email customerId')
      .populate('account', 'accountNumber');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Passbook request not found',
      });
    }

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    request.processedBy = req.user._id;

    if (status === 'Issued') {
      request.issuedAt = new Date();
      if (passbookNumber) {
        request.passbookNumber = passbookNumber;
      } else if (!request.passbookNumber) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        request.passbookNumber = `PBK-${new Date().getFullYear()}-${rand}`;
      }
    }

    await request.save();

    let notifTitle = 'Passbook Update';
    let notifMessage = `Your passbook request for account #${request.account?.accountNumber || ''} is now marked as ${status}.`;

    if (status === 'Issued') {
      notifTitle = '?? Physical Passbook Issued!';
      notifMessage = `Your Passbook #${request.passbookNumber} has been officially printed, stamped, and issued for Account #${request.account?.accountNumber || ''}.`;
    } else if (status === 'Rejected') {
      notifTitle = 'Passbook Request Declined';
      notifMessage = `Your passbook application was declined. Note: ${adminNotes || 'Verification criteria not met'}`;
    }

    await Notification.create({
      user: request.user._id,
      title: notifTitle,
      message: notifMessage,
      type: 'SERVICE',
    });

    await AuditLog.create({
      user: req.user._id,
      action: `PASSBOOK_${status.toUpperCase()}`,
      entity: 'PassbookRequest',
      entityId: request._id.toString(),
      metadata: {
        customerId: request.user._id,
        status,
        passbookNumber: request.passbookNumber,
        adminNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: `Passbook request successfully ${status.toLowerCase()}`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
