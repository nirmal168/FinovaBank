const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const generateTransactionId = require('../utils/generateTransactionId');
const { createNotification } = require('../utils/notificationService');
const otpService = require('../services/otpService');
const fraudDetectionService = require('../services/fraudDetectionService');
const { emitAdminFraudAlert } = require('../utils/socket');
const { logAuditEvent } = require('../utils/auditLogger');
const emailService = require('../services/emailService');

// @desc    Deposit funds into account
// @route   POST /api/transactions/deposit
// @access  Private (Bearer token)
const deposit = async (req, res, next) => {
  try {
    const { amount, description, reference } = req.body;
    const numericAmount = parseFloat(amount);

    // Business validation: amount must be greater than 0
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be greater than 0.',
      });
    }

    // Get target account: either by passed accountNumber, accountId, or primary account
    let account;
    const targetAccountParam = req.body.accountNumber || req.body.accountId;
    if (targetAccountParam) {
      const query = typeof targetAccountParam === 'string' && targetAccountParam.length === 24 && /^[0-9a-fA-F]{24}$/.test(targetAccountParam)
        ? { _id: targetAccountParam }
        : { accountNumber: targetAccountParam };
      const rawAccount = await Account.findOne(query);
      if (!rawAccount) {
        return res.status(404).json({
          success: false,
          message: 'Target bank account not found.',
        });
      }
      if (rawAccount.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to deposit into this account.',
        });
      }
      account = rawAccount;
    } else {
      account = await Account.getOrCreateUserAccount(req.user._id);
    }

    // Business validation: account must be active
    if (account.status.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${account.status.toLowerCase()}. Deposits are not permitted.`,
      });
    }

    // Update balance
    account.balance = parseFloat((account.balance + numericAmount).toFixed(2));
    await account.save();

    // Create transaction record
    const transactionId = generateTransactionId('DEP');
    const transaction = await Transaction.create({
      transactionId,
      user: req.user._id,
      senderAccount: 'EXTERNAL-DEPOSIT',
      receiverAccount: account.accountNumber,
      amount: numericAmount,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: description?.trim() || 'Direct Account Deposit',
      reference: reference?.trim() || `REF-${Date.now()}`,
      balanceAfter: account.balance,
    });

    // Auto-trigger DEPOSIT notification
    await createNotification({
      user: req.user._id,
      title: 'Deposit Successful',
      message: `Deposit of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} credited to account #${account.accountNumber}. New balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      type: 'DEPOSIT',
    });

    // Send Deposit Transaction Email
    emailService.sendTransactionEmail({
      to: req.user.email,
      name: req.user.name,
      transaction,
      account,
      userPreferences: req.user.emailPreferences,
    }).catch((err) => {
      console.warn('[Transaction] Deposit email dispatch skipped/failed:', err.message);
    });

    // If high value (>= 5000), notify user of AML fraud review
    if (numericAmount >= 5000) {
      await createNotification({
        user: req.user._id,
        title: 'High Value Transaction Monitored',
        message: `Your deposit of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} meets institutional compliance reporting thresholds.`,
        type: 'FRAUD',
      });
    }

    // Audit log DEPOSIT event
    await logAuditEvent({
      user: req.user._id,
      action: 'DEPOSIT',
      entity: 'Transaction',
      entityId: transaction._id,
      req,
      metadata: {
        amount: numericAmount,
        accountNumber: account.accountNumber,
        transactionId: transaction.transactionId,
        balanceAfter: account.balance,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Deposit processed successfully.',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
        balance: account.balance,
        accountNumber: account.accountNumber,
        currency: account.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw funds from account
// @route   POST /api/transactions/withdraw
// @access  Private (Bearer token)
const withdraw = async (req, res, next) => {
  try {
    const { amount, description, reference } = req.body;
    const numericAmount = parseFloat(amount);

    // Business validation: amount must be greater than 0
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be greater than 0.',
      });
    }

    // Get target account: either by passed accountNumber, accountId, or primary account
    let account;
    const targetAccountParam = req.body.accountNumber || req.body.accountId;
    if (targetAccountParam) {
      const query = typeof targetAccountParam === 'string' && targetAccountParam.length === 24 && /^[0-9a-fA-F]{24}$/.test(targetAccountParam)
        ? { _id: targetAccountParam }
        : { accountNumber: targetAccountParam };
      const rawAccount = await Account.findOne(query);
      if (!rawAccount) {
        return res.status(404).json({
          success: false,
          message: 'Target bank account not found.',
        });
      }
      if (rawAccount.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to withdraw from this account.',
        });
      }
      account = rawAccount;
    } else {
      account = await Account.getOrCreateUserAccount(req.user._id);
    }

    // Business validation: account must be active
    if (account.status.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${account.status.toLowerCase()}. Withdrawals are not permitted.`,
      });
    }

    // Business validation: sufficient balance required
    if (account.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available funds: $${account.balance.toFixed(2)}, Requested: $${numericAmount.toFixed(2)}.`,
        currentBalance: account.balance,
      });
    }

    // Update balance
    account.balance = parseFloat((account.balance - numericAmount).toFixed(2));
    await account.save();

    // Create transaction record
    const transactionId = generateTransactionId('WTH');
    const transaction = await Transaction.create({
      transactionId,
      user: req.user._id,
      senderAccount: account.accountNumber,
      receiverAccount: 'ATM-WITHDRAWAL',
      amount: numericAmount,
      type: 'WITHDRAW',
      status: 'COMPLETED',
      description: description?.trim() || 'Cash Withdrawal',
      reference: reference?.trim() || `REF-${Date.now()}`,
      balanceAfter: account.balance,
    });

    // Auto-trigger WITHDRAWAL notification
    await createNotification({
      user: req.user._id,
      title: 'Cash Withdrawal Successful',
      message: `Withdrawal of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} debited from account #${account.accountNumber}. New balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      type: 'WITHDRAWAL',
    });

    // Send Withdrawal Transaction Email
    emailService.sendTransactionEmail({
      to: req.user.email,
      name: req.user.name,
      transaction,
      account,
      userPreferences: req.user.emailPreferences,
    }).catch((err) => {
      console.warn('[Transaction] Withdrawal email dispatch skipped/failed:', err.message);
    });

    // If high value (>= 5000), notify user
    if (numericAmount >= 5000) {
      await createNotification({
        user: req.user._id,
        title: 'Large Cash Outflow Monitored',
        message: `Your withdrawal of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} meets institutional compliance monitoring rules.`,
        type: 'FRAUD',
      });
    }

    // Audit log WITHDRAWAL event
    await logAuditEvent({
      user: req.user._id,
      action: 'WITHDRAWAL',
      entity: 'Transaction',
      entityId: transaction._id,
      req,
      metadata: {
        amount: numericAmount,
        accountNumber: account.accountNumber,
        transactionId: transaction.transactionId,
        balanceAfter: account.balance,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully.',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
        balance: account.balance,
        accountNumber: account.accountNumber,
        currency: account.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's primary account details and live balance
// @route   GET /api/transactions/account
// @access  Private (Bearer token)
const getAccount = async (req, res, next) => {
  try {
    const account = await Account.getOrCreateUserAccount(req.user._id);
    res.status(200).json({
      success: true,
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's transaction history
// @route   GET /api/transactions/history
// @access  Private (Bearer token)
const getHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer money between bank accounts atomically
// @route   POST /api/transactions/transfer
// @access  Private (Bearer token)
const transfer = async (req, res, next) => {
  let session = null;
  try {
    const {
      senderAccountNumber,
      senderAccount: reqSenderAcc,
      receiverAccountNumber,
      receiverAccount: reqReceiverAcc,
      amount,
      description,
      reference,
    } = req.body;

    const numericAmount = parseFloat(amount);

    // 1. Validate amount
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer amount must be a positive number greater than 0.',
      });
    }

    // 2. Resolve Sender Account
    let senderAccount;
    const specifiedSender = (senderAccountNumber || reqSenderAcc)?.trim();
    if (specifiedSender) {
      senderAccount = await Account.findOne({
        user: req.user._id,
        accountNumber: specifiedSender,
      });
      if (!senderAccount) {
        return res.status(404).json({
          success: false,
          message: 'Sender bank account not found or does not belong to you.',
        });
      }
    } else {
      senderAccount = await Account.getOrCreateUserAccount(req.user._id);
    }

    // 3. Sender must be Active
    if (senderAccount.status.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Sender account is ${senderAccount.status.toLowerCase()}. Transfers are not permitted.`,
      });
    }

    // 4. Resolve Receiver Account
    const targetReceiverNum = (receiverAccountNumber || reqReceiverAcc)?.trim();
    if (!targetReceiverNum) {
      return res.status(400).json({
        success: false,
        message: 'Receiver account number is required.',
      });
    }

    const receiverAccount = await Account.findOne({
      accountNumber: targetReceiverNum,
    }).populate('user', 'name email');

    if (!receiverAccount) {
      return res.status(404).json({
        success: false,
        message: 'Receiver account not found. Please verify the 12-digit number.',
      });
    }

    // 5. Sender and receiver must be different
    if (senderAccount.accountNumber === receiverAccount.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Sender and receiver accounts must be different.',
      });
    }

    // 6. Receiver must be Active
    if (receiverAccount.status.toLowerCase() !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Receiver account is ${receiverAccount.status.toLowerCase()} and cannot receive funds.`,
      });
    }

    // 7. Check sufficient balance
    if (senderAccount.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available funds: $${senderAccount.balance.toFixed(2)}, Requested: $${numericAmount.toFixed(2)}.`,
        currentBalance: senderAccount.balance,
      });
    }

    // 8. Enforce Daily Transfer Limit
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const todayTransfers = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          senderAccount: senderAccount.accountNumber,
          type: 'TRANSFER',
          status: 'COMPLETED',
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalTransferred: { $sum: '$amount' },
        },
      },
    ]);

    const todayTotal = todayTransfers.length > 0 ? todayTransfers[0].totalTransferred : 0;
    const dailyLimit = senderAccount.dailyTransferLimit || 5000.0;

    if (todayTotal + numericAmount > dailyLimit) {
      const remainingLimit = Math.max(0, dailyLimit - todayTotal);
      return res.status(400).json({
        success: false,
        message: `Daily transfer limit exceeded. Daily limit: $${dailyLimit.toFixed(2)}, already sent today: $${todayTotal.toFixed(2)}, remaining: $${remainingLimit.toFixed(2)}.`,
        dailyLimit,
        todayTransferred: todayTotal,
        remainingLimit,
      });
    }

    // 8b. RULE-BASED FRAUD DETECTION ANALYSIS (Phase 15)
    const fraudAnalysis = await fraudDetectionService.analyzeTransaction({
      user: req.user,
      senderAccount,
      receiverAccount,
      amount: numericAmount,
    });

    const { riskScore, riskLevel, reason: riskReason, factors: riskFactors } = fraudAnalysis;
    const { otp } = req.body;
    const LARGE_TRANSFER_THRESHOLD = 1000.0;
    const requiresOtp = riskLevel === 'HIGH' || riskLevel === 'MEDIUM' || numericAmount >= LARGE_TRANSFER_THRESHOLD;

    if (requiresOtp) {
      if (!otp) {
        // If HIGH risk, create fraud alert immediately in PENDING status
        if (riskLevel === 'HIGH') {
          try {
            const fraudAlert = await FraudAlert.create({
              user: req.user._id,
              senderAccount: senderAccount.accountNumber,
              receiverAccount: receiverAccount.accountNumber,
              amount: numericAmount,
              riskScore,
              riskLevel,
              reason: riskReason,
              factors: riskFactors,
              status: 'PENDING',
              actionTaken: 'NONE',
            });

            // Notify Admin via Notification model & Socket.IO
            const adminUsers = await User.find({ role: 'admin' }).select('_id');
            for (const admin of adminUsers) {
              await createNotification({
                user: admin._id,
                title: `🚨 High Risk Fraud Alert (${riskScore}/100)`,
                message: `Customer ${req.user.name} initiated a high-risk transfer of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to #${receiverAccount.accountNumber}. Reason: ${riskReason}`,
                type: 'FRAUD',
              });
            }

            emitAdminFraudAlert({
              _id: fraudAlert._id,
              user: { _id: req.user._id, name: req.user.name, email: req.user.email },
              senderAccount: senderAccount.accountNumber,
              receiverAccount: receiverAccount.accountNumber,
              amount: numericAmount,
              riskScore,
              riskLevel,
              reason: riskReason,
              factors: riskFactors,
              status: 'PENDING',
              createdAt: fraudAlert.createdAt,
            });
          } catch (notifErr) {
            console.warn('[FraudController] Admin notification error:', notifErr.message);
          }
        }

        // Halt and dispatch OTP to user email (handling cooldown if one was just dispatched)
        let cooldown = 60;
        let otpResult = null;
        try {
          otpResult = await otpService.sendOtp({
            user: req.user._id,
            email: req.user.email,
            purpose: 'TRANSFER',
            metadata: {
              amount: numericAmount,
              receiverAccount: receiverAccount.accountNumber,
              senderAccount: senderAccount.accountNumber,
              riskScore,
              riskLevel,
            },
          });
          cooldown = otpResult.cooldown;
        } catch (otpErr) {
          if (otpErr.statusCode === 429) {
            cooldown = otpErr.cooldownRemaining || 0;
          } else {
            throw otpErr;
          }
        }

        const alertMessage =
          riskLevel === 'HIGH'
            ? `Security Alert: High-risk activity detected (${riskScore}/100 - ${riskReason}). A one-time verification code has been dispatched to your registered email to authorize this transfer.`
            : `Security Verification Required: A one-time verification code has been dispatched to your registered email to authorize this transfer of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`;

        // If High Risk, dispatch security alert email to user
        if (riskLevel === 'HIGH') {
          emailService.sendFraudAlertEmail({
            to: req.user.email,
            name: req.user.name,
            alertData: {
              amount: numericAmount,
              riskLevel,
              riskScore,
              reason: riskReason,
              actionRequired: 'Verify via the 6-digit OTP dispatched to your registered email or freeze your account if this was unauthorized.',
            },
          }).catch((err) => {
            console.warn('[Transaction] Fraud alert email dispatch skipped/failed:', err.message);
          });
        }

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          riskScore,
          riskLevel,
          reason: riskReason,
          message: alertMessage,
          cooldown,
        });
      } else {
        // Verify submitted OTP
        const verification = await otpService.verifyOtp({
          email: req.user.email,
          otp,
          purpose: 'TRANSFER',
        });

        if (!verification.valid) {
          return res.status(400).json({
            success: false,
            message: verification.message,
            remainingAttempts: verification.remainingAttempts,
          });
        }
      }
    }

    // 8c. High Risk Transaction Holding (Optionally hold for critical risk scores >= 85)
    const isCriticalRisk = riskLevel === 'HIGH' && (riskScore >= 85 || req.body.holdTransaction === true);
    const executionStatus = isCriticalRisk ? 'HELD' : 'COMPLETED';

    // 9. Execute Atomic Debit and Credit (MongoDB Transaction with Standalone fallback)
    const senderNewBalance = parseFloat((senderAccount.balance - numericAmount).toFixed(2));
    const receiverNewBalance = parseFloat((receiverAccount.balance + numericAmount).toFixed(2));

    let session = null;
    let transactionStarted = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      transactionStarted = true;
    } catch (e) {
      session = null;
      transactionStarted = false;
    }

    try {
      if (transactionStarted && session) {
        try {
          // Debit Sender
          senderAccount.balance = senderNewBalance;
          await senderAccount.save({ session });

          // Credit Receiver only if NOT held
          if (!isCriticalRisk) {
            receiverAccount.balance = receiverNewBalance;
            await receiverAccount.save({ session });
          }
        } catch (txError) {
          if (
            txError.message &&
            (txError.message.includes('Transaction numbers are only allowed on a replica set member') ||
              txError.message.includes('replica set'))
          ) {
            // Standalone mongod deployment detected: abort session and proceed directly
            await session.abortTransaction();
            session.endSession();
            session = null;
            transactionStarted = false;

            senderAccount.balance = senderNewBalance;
            await senderAccount.save();

            if (!isCriticalRisk) {
              receiverAccount.balance = receiverNewBalance;
              await receiverAccount.save();
            }
          } else {
            throw txError;
          }
        }
      } else {
        senderAccount.balance = senderNewBalance;
        await senderAccount.save();

        if (!isCriticalRisk) {
          receiverAccount.balance = receiverNewBalance;
          await receiverAccount.save();
        }
      }

      const senderTxnId = generateTransactionId('TRF');
      const commonReference = reference?.trim() || `REF-${Date.now()}`;
      const txnOptions = session && transactionStarted ? { session } : {};

      // Create Sender debit record
      const [senderTxn] = await Transaction.create(
        [
          {
            transactionId: senderTxnId,
            user: senderAccount.user,
            senderAccount: senderAccount.accountNumber,
            receiverAccount: receiverAccount.accountNumber,
            amount: numericAmount,
            type: 'TRANSFER',
            status: executionStatus,
            description: isCriticalRisk
              ? `[HELD - UNDER REVIEW] ${description?.trim() || `Transfer to ${receiverAccount.accountNumber}`}`
              : description?.trim() || `Transfer to ${receiverAccount.accountNumber}`,
            reference: commonReference,
            balanceAfter: senderAccount.balance,
          },
        ],
        txnOptions
      );

      // Create Receiver credit record only if COMPLETED
      const receiverUserId = receiverAccount.user?._id || receiverAccount.user;
      const senderUserId = senderAccount.user?._id || senderAccount.user;

      if (!isCriticalRisk && receiverUserId && receiverUserId.toString() !== senderUserId.toString()) {
        const receiverTxnId = generateTransactionId('TRF');
        await Transaction.create(
          [
            {
              transactionId: receiverTxnId,
              user: receiverUserId,
              senderAccount: senderAccount.accountNumber,
              receiverAccount: receiverAccount.accountNumber,
              amount: numericAmount,
              type: 'TRANSFER',
              status: 'COMPLETED',
              description: description?.trim()
                ? `Transfer from ${req.user.name || 'SecureBank User'}: ${description.trim()}`
                : `Transfer from ${senderAccount.accountNumber}`,
              reference: commonReference,
              balanceAfter: receiverAccount.balance,
            },
          ],
          txnOptions
        );
      }

      if (session && transactionStarted) {
        await session.commitTransaction();
        session.endSession();
        session = null;
      }

      // Link or create FraudAlert if risk was HIGH
      if (riskLevel === 'HIGH') {
        try {
          const existingAlert = await FraudAlert.findOne({
            user: req.user._id,
            senderAccount: senderAccount.accountNumber,
            receiverAccount: receiverAccount.accountNumber,
            amount: numericAmount,
            status: 'PENDING',
          }).sort({ createdAt: -1 });

          if (existingAlert) {
            existingAlert.transaction = senderTxn._id;
            existingAlert.actionTaken = isCriticalRisk ? 'TRANSACTION_HELD' : 'OTP_VERIFIED';
            await existingAlert.save();
          } else {
            await FraudAlert.create({
              user: req.user._id,
              senderAccount: senderAccount.accountNumber,
              receiverAccount: receiverAccount.accountNumber,
              amount: numericAmount,
              riskScore,
              riskLevel,
              reason: riskReason,
              factors: riskFactors,
              transaction: senderTxn._id,
              status: 'PENDING',
              actionTaken: isCriticalRisk ? 'TRANSACTION_HELD' : 'OTP_VERIFIED',
            });
          }
        } catch (alertSaveErr) {
          console.warn('[FraudController] Alert linking error:', alertSaveErr.message);
        }
      }

      // Auto-trigger TRANSFER notification for Sender
      await createNotification({
        user: senderUserId,
        title: isCriticalRisk ? '⚠️ Transfer Held for Security Review' : 'Transfer Sent',
        message: isCriticalRisk
          ? `Your transfer of ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to #${receiverAccount.accountNumber} has been placed on temporary hold for compliance review.`
          : `Sent ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to account #${receiverAccount.accountNumber}. New balance: ₹${senderAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        type: isCriticalRisk ? 'FRAUD' : 'TRANSFER',
      });

      // Send Transfer Transaction Email to Sender
      emailService.sendTransactionEmail({
        to: req.user.email,
        name: req.user.name,
        transaction: senderTxn,
        account: senderAccount,
        recipient: `#${receiverAccount.accountNumber}`,
        userPreferences: req.user.emailPreferences,
      }).catch((err) => {
        console.warn('[Transaction] Sender transfer email dispatch skipped/failed:', err.message);
      });

      // Auto-trigger TRANSFER notification for Receiver (if on platform and NOT held)
      if (!isCriticalRisk && receiverUserId && receiverUserId.toString() !== senderUserId.toString()) {
        await createNotification({
          user: receiverUserId,
          title: 'Money Received',
          message: `Received ₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${req.user.name || 'Finova Customer'} into account #${receiverAccount.accountNumber}. New balance: ₹${receiverAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          type: 'TRANSFER',
        });
      }

      const remainingDailyLimit = Math.max(0, dailyLimit - (todayTotal + numericAmount));

      // Audit log TRANSFER event
      await logAuditEvent({
        user: senderUserId,
        action: 'TRANSFER',
        entity: 'Transaction',
        entityId: senderTxn._id,
        req,
        metadata: {
          amount: numericAmount,
          senderAccount: senderAccount.accountNumber,
          receiverAccount: receiverAccount.accountNumber,
          transactionId: senderTxn.transactionId,
          status: executionStatus,
          isHeld: isCriticalRisk,
          riskScore,
          riskLevel,
        },
      });

      res.status(200).json({
        success: true,
        isHeld: isCriticalRisk,
        riskScore,
        riskLevel,
        message: isCriticalRisk
          ? 'Transfer placed on hold for institutional compliance review. Our fraud prevention desk has been notified.'
          : 'Money transfer completed successfully.',
        transaction: {
          transactionId: senderTxn.transactionId,
          amount: senderTxn.amount,
          type: senderTxn.type,
          status: senderTxn.status,
          description: senderTxn.description,
          reference: senderTxn.reference,
          senderAccount: senderAccount.accountNumber,
          receiverAccount: receiverAccount.accountNumber,
          receiverName: receiverAccount.user?.name || 'Verified Customer',
          balance: senderAccount.balance,
          remainingDailyLimit,
          createdAt: senderTxn.createdAt,
        },
      });
    } catch (innerError) {
      if (session && transactionStarted) {
        await session.abortTransaction();
        session.endSession();
      }
      throw innerError;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions with pagination, search, filters & sorting
// @route   GET /api/transactions
// @access  Private (Bearer token)
const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      type,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      accountNumber,
    } = req.query;

    // Security: Only return transactions belonging to the authenticated user (unless admin with all=true)
    const query =
      req.user.role === 'admin' && req.query.all === 'true'
        ? {}
        : { user: req.user._id };

    // Filter by type
    if (type && type.toUpperCase() !== 'ALL') {
      query.type = type.toUpperCase();
    }

    // Filter by status
    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }

    // Filter by specific account number
    if (accountNumber) {
      query.$or = [
        { senderAccount: accountNumber.trim() },
        { receiverAccount: accountNumber.trim() },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          query.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    // Search query (transactionId, description, reference, senderAccount, receiverAccount)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { transactionId: searchRegex },
        { description: searchRegex },
        { reference: searchRegex },
        { senderAccount: searchRegex },
        { receiverAccount: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Sorting
    const sortField = ['createdAt', 'amount', 'status', 'type'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection = sortOrder?.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // Execute query with total count
    const [totalCount, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction details by ID or transactionId
// @route   GET /api/transactions/:id
// @access  Private (Bearer token)
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if valid ObjectId or query by transactionId
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { transactionId: id.trim() };

    const transaction = await Transaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    // Ownership check: User must own the transaction or be an admin
    if (
      transaction.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this transaction.',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate comprehensive bank statement for an account
// @route   GET /api/transactions/statement
// @access  Private (Bearer token)
const getStatement = async (req, res, next) => {
  try {
    const { accountNumber, startDate, endDate, type } = req.query;

    // Find account
    let account;
    if (accountNumber) {
      account = await Account.findOne({ accountNumber: accountNumber.trim() });
    } else {
      account = await Account.getOrCreateUserAccount(req.user._id);
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Security check: Must belong to user or admin
    if (account.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this account statement.',
      });
    }

    // Date range default: last 30 days
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const query = {
      $or: [
        { senderAccount: account.accountNumber },
        { receiverAccount: account.accountNumber },
      ],
      createdAt: { $gte: start, $lte: end },
    };

    if (type && type.toUpperCase() !== 'ALL') {
      query.type = type.toUpperCase();
    }

    // Fetch transactions sorted chronologically
    const rawTransactions = await Transaction.find(query).sort({ createdAt: 1 }).lean();

    let totalCredits = 0;
    let totalDebits = 0;
    let creditCount = 0;
    let debitCount = 0;

    const formattedTransactions = rawTransactions.map((tx) => {
      const isCredit =
        tx.type === 'DEPOSIT' ||
        tx.receiverAccount === account.accountNumber ||
        (tx.type === 'REFUND' && tx.receiverAccount === account.accountNumber);

      const isDebit =
        tx.type === 'WITHDRAW' ||
        tx.type === 'PAYMENT' ||
        (tx.type === 'TRANSFER' && tx.senderAccount === account.accountNumber);

      if (isCredit) {
        totalCredits += tx.amount;
        creditCount++;
      } else {
        totalDebits += tx.amount;
        debitCount++;
      }

      return {
        ...tx,
        isCredit,
        isDebit,
        creditAmount: isCredit ? tx.amount : 0,
        debitAmount: isDebit ? tx.amount : 0,
      };
    });

    const user = await User.findById(account.user).select('name email phone customerId address');

    res.status(200).json({
      success: true,
      data: {
        account: {
          accountNumber: account.accountNumber,
          accountType: account.accountType || 'Savings',
          currency: account.currency || 'INR',
          currentBalance: account.balance,
          status: account.status,
          ifscCode: account.ifscCode || 'FINV0001088',
          branch: account.branch || 'Connaught Place, New Delhi',
        },
        user: {
          name: user?.name || req.user.name,
          email: user?.email || req.user.email,
          phone: user?.phone || req.user.phone,
          customerId: user?.customerId || req.user.customerId,
          address: user?.address || null,
        },
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        summary: {
          totalCredits,
          totalDebits,
          creditCount,
          debitCount,
          netFlow: totalCredits - totalDebits,
          closingBalance: account.balance,
          transactionCount: formattedTransactions.length,
        },
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deposit,
  withdraw,
  getAccount,
  getHistory,
  transfer,
  getTransactions,
  getTransactionById,
  getStatement,
};


