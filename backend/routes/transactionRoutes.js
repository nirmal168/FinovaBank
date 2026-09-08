const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  deposit,
  withdraw,
  getAccount,
  getHistory,
  transfer,
  getTransactions,
  getTransactionById,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { transferLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Middleware to format validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// All transaction routes are protected
router.use(protect);

// @route   GET /api/transactions - Paginated, filtered, searchable transaction list
router.get('/', getTransactions);

// @route   GET /api/transactions/account
router.get('/account', getAccount);

// @route   GET /api/transactions/history
router.get('/history', getHistory);

// @route   GET /api/transactions/:id - Single transaction details by ID or transactionId
router.get('/:id', getTransactionById);

// @route   POST /api/transactions/deposit
router.post(
  '/deposit',
  [
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Description cannot exceed 100 characters'),
  ],
  handleValidation,
  deposit
);

// @route   POST /api/transactions/withdraw
router.post(
  '/withdraw',
  [
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Description cannot exceed 100 characters'),
  ],
  handleValidation,
  withdraw
);

// @route   POST /api/transactions/transfer
router.post(
  '/transfer',
  transferLimiter,
  [
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number greater than 0'),
    body('receiverAccount')
      .optional()
      .trim(),
    body('receiverAccountNumber')
      .optional()
      .trim(),
    body()
      .custom((value) => {
        if (!value.receiverAccount && !value.receiverAccountNumber) {
          throw new Error('Receiver account number is required');
        }
        return true;
      }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage('Description cannot exceed 150 characters'),
  ],
  handleValidation,
  transfer
);

module.exports = router;

