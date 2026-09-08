const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccountStatus,
  lookupAccount,
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

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

// All account routes are protected
router.use(protect);

// @route   POST /api/accounts - Create a new bank account
router.post(
  '/',
  [
    body('accountType')
      .optional()
      .custom((value) => {
        if (!['Savings', 'Current', 'savings', 'current'].includes(value)) {
          throw new Error('Account type must be either Savings or Current');
        }
        return true;
      }),
    body('initialDeposit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Initial deposit cannot be negative'),
  ],
  handleValidation,
  createAccount
);

// @route   GET /api/accounts - List user's bank accounts
router.get('/', getAccounts);

// @route   GET /api/accounts/lookup/:accountNumber - Verify recipient account
router.get('/lookup/:accountNumber', lookupAccount);

// @route   GET /api/accounts/:id - Get specific account details
router.get('/:id', getAccountById);

// @route   PUT /api/accounts/:id/status - Freeze / Unfreeze / Close account
router.put(
  '/:id/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .custom((value) => {
        if (!['Active', 'Frozen', 'Closed', 'active', 'frozen', 'closed'].includes(value)) {
          throw new Error('Status must be Active, Frozen, or Closed');
        }
        return true;
      }),
  ],
  handleValidation,
  updateAccountStatus
);

module.exports = router;
