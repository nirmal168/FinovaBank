const Card = require('../models/Card');
const Account = require('../models/Account');
const otpService = require('../services/otpService');
const { createNotification } = require('../utils/notificationService');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Apply for a virtual debit card (customer submits application — admin must approve)
 * @route   POST /api/cards/apply
 * @access  Private (JWT customer)
 */
exports.applyCard = async (req, res, next) => {
  try {
    const { accountId, cardType, pin, transactionLimit } = req.body;
    const targetAccountId = accountId || req.body.account;

    // Validate Account exists and belongs to current user
    let account;
    if (targetAccountId) {
      const isMongoId = typeof targetAccountId === 'string' && /^[0-9a-fA-F]{24}$/.test(targetAccountId);
      if (isMongoId) {
        account = await Account.findById(targetAccountId);
      }
      if (!account) {
        account = await Account.findOne({ accountNumber: targetAccountId });
      }
    }
    if (!account) {
      account = await Account.getOrCreateUserAccount(req.user._id);
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'No bank account found for this user.',
      });
    }

    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to link a card to this account.',
      });
    }

    if (account.status && account.status.toLowerCase() !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply for a card on account with status "${account.status}". Account must be Active.`,
      });
    }

    // Check for an existing pending application to prevent duplicates
    const existingPending = await Card.findOne({
      user: req.user._id,
      account: account._id,
      status: 'Pending',
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending card application for this account. Please wait for admin approval.',
      });
    }

    // Generate simulated 4-digit last four (will be finalised by admin on issuance)
    const randomLastFour = Math.floor(1000 + Math.random() * 9000).toString();

    // Determine prefix based on card network
    const isMastercard = cardType && cardType.toLowerCase().includes('mastercard');
    const prefix = isMastercard ? '5412' : '4532';
    const maskedCardNumber = `${prefix} •••• •••• ${randomLastFour}`;

    // Calculate simulated expiry date: 4 years from issue
    const now = new Date();
    const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expiryYear = String((now.getFullYear() + 4) % 100).padStart(2, '0');
    const expiryDate = `${expiryMonth}/${expiryYear}`;

    // Hash 4-digit PIN
    const hashedPin = await Card.hashPin(pin);

    // Create card application — status is Pending until admin approves and issues it
    const card = await Card.create({
      user: req.user._id,
      account: account._id,
      maskedCardNumber,
      lastFour: randomLastFour,
      cardType: cardType || 'Visa Platinum Debit',
      cardholderName: req.user.name,
      expiryDate,
      pin: hashedPin,
      status: 'Pending',   // ← Admin must activate this card
      transactionLimit: transactionLimit ? Number(transactionLimit) : 25000,
    });

    // Populate linked account info (omits sensitive pin automatically)
    await card.populate('account', 'accountNumber accountType balance currency status');

    // Audit log CARD_APPLICATION event
    await logAuditEvent({
      user: req.user._id,
      action: 'CARD_APPLY',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        cardType: card.cardType,
        lastFour: card.lastFour,
        transactionLimit: card.transactionLimit,
        status: 'Pending — awaiting admin issuance',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Card application submitted successfully! Your card will be activated once approved by the bank administration.',
      card: {
        _id: card._id,
        maskedCardNumber: card.maskedCardNumber,
        lastFour: card.lastFour,
        cardType: card.cardType,
        cardholderName: card.cardholderName,
        expiryDate: card.expiryDate,
        status: card.status,
        transactionLimit: card.transactionLimit,
        account: card.account,
        createdAt: card.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all virtual debit cards for current user
 * @route   GET /api/cards
 * @access  Private (JWT)
 */
exports.getCards = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : { user: req.user._id };

    const cards = await Card.find(filter)
      .populate('account', 'accountNumber accountType balance currency status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cards.length,
      cards,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single card details by ID
 * @route   GET /api/cards/:id
 * @access  Private (JWT)
 */
exports.getCardById = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate('account', 'accountNumber accountType balance currency status');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Debit card not found.',
      });
    }

    // Ownership check
    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this card.',
      });
    }

    res.status(200).json({
      success: true,
      card,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update card status (Activate, Block, Unblock)
 * @route   PUT /api/cards/:id/status
 * @access  Private (JWT)
 */
exports.updateCardStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Active', 'Blocked', 'Inactive'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Debit card not found.',
      });
    }

    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this card.',
      });
    }

    card.status = status;
    await card.save();

    await card.populate('account', 'accountNumber accountType balance currency status');

    // Audit log CARD status event
    await logAuditEvent({
      user: req.user._id,
      action: status === 'Active' ? 'CARD_ACTIVATE' : 'CARD_BLOCK_TOGGLE',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        status,
        lastFour: card.lastFour,
      },
    });

    res.status(200).json({
      success: true,
      message: `Card has been successfully ${status === 'Blocked' ? 'blocked' : status === 'Active' ? 'activated' : 'deactivated'}.`,
      card,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change / Update card 4-digit PIN
 * @route   PUT /api/cards/:id/pin
 * @access  Private (JWT)
 */
exports.changePin = async (req, res, next) => {
  try {
    const { currentPin, newPin, confirmPin, otp } = req.body;

    if (!newPin || !/^[0-9]{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be exactly 4 numeric digits.',
      });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN and confirmation PIN do not match.',
      });
    }

    const card = await Card.findById(req.params.id).select('+pin');
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Debit card not found.',
      });
    }

    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this card.',
      });
    }

    if (card.status === 'Blocked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change PIN while card is blocked. Please unblock the card first.',
      });
    }

    // Verify current PIN if provided
    if (currentPin) {
      const isMatch = await card.matchPin(currentPin);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is incorrect.',
        });
      }
    }

    // If OTP is provided, verify it; if requiresOtp flag is set, send OTP
    if (req.body.requiresOtp && !otp) {
      const otpResult = await otpService.sendOtp({
        user: req.user._id,
        email: req.user.email,
        purpose: 'CARD_PIN',
        metadata: { cardId: card._id },
      });
      return res.status(200).json({
        success: true,
        requiresOtp: true,
        message: `Security Verification: A 6-digit OTP has been dispatched to ${req.user.email} to confirm your PIN change.`,
        cooldown: otpResult.cooldown,
      });
    }

    if (otp) {
      const verification = await otpService.verifyOtp({
        email: req.user.email,
        otp,
        purpose: 'CARD_PIN',
      });
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          message: verification.message,
          remainingAttempts: verification.remainingAttempts,
        });
      }
    }

    // Hash and update
    card.pin = await Card.hashPin(newPin);
    await card.save();

    await createNotification({
      user: req.user._id,
      title: 'Debit Card PIN Updated',
      message: `Security Notice: The PIN for card ending in •••• ${card.lastFour} was successfully changed.`,
      type: 'ACCOUNT',
    });

    // Audit log CARD_PIN_CHANGE event (no credentials)
    await logAuditEvent({
      user: req.user._id,
      action: 'CARD_PIN_CHANGE',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        lastFour: card.lastFour,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Card PIN updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update card daily transaction limit
 * @route   PUT /api/cards/:id/limit
 * @access  Private (JWT)
 */
exports.setTransactionLimit = async (req, res, next) => {
  try {
    const { transactionLimit } = req.body;
    const numericLimit = Number(transactionLimit);

    if (isNaN(numericLimit) || numericLimit < 100 || numericLimit > 500000) {
      return res.status(400).json({
        success: false,
        message: 'Transaction limit must be between ₹100.00 and ₹5,00,000.00.',
      });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Debit card not found.',
      });
    }

    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this card.',
      });
    }

    card.transactionLimit = numericLimit;
    await card.save();

    await card.populate('account', 'accountNumber accountType balance currency status');

    // Audit log CARD_LIMIT_CHANGE event
    await logAuditEvent({
      user: req.user._id,
      action: 'CARD_LIMIT_CHANGE',
      entity: 'Card',
      entityId: card._id,
      req,
      metadata: {
        transactionLimit: numericLimit,
        lastFour: card.lastFour,
      },
    });

    res.status(200).json({
      success: true,
      message: `Daily transaction limit updated to ₹${numericLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      card,
    });
  } catch (error) {
    next(error);
  }
};
