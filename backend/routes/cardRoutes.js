const express = require('express');
const { check, validationResult } = require('express-validator');
const {
  applyCard,
  getCards,
  getCardById,
  updateCardStatus,
  changePin,
  setTransactionLimit,
} = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// All card routes require authentication
router.use(protect);

// Validation rules for card application
const applyCardValidation = [
  check('pin', 'PIN must be exactly 4 numeric digits').isNumeric().isLength({ min: 4, max: 4 }),
  check('cardType')
    .optional()
    .isIn([
      'Visa Platinum Debit',
      'Mastercard Gold Debit',
      'Visa Signature Debit',
      'Mastercard World Debit',
    ])
    .withMessage('Invalid card type selected'),
  check('transactionLimit')
    .optional()
    .isFloat({ min: 50, max: 10000 })
    .withMessage('Daily transaction limit must be between $50 and $10,000'),
  check('accountId')
    .custom((value, { req }) => {
      const targetId = value || req.body.account;
      if (!targetId) {
        throw new Error('Please select a valid bank account');
      }
      return true;
    }),
];

// @route   POST /api/cards/apply & POST /api/cards
router.post('/apply', applyCardValidation, validate, applyCard);
router.post('/', applyCardValidation, validate, applyCard);

// @route   GET /api/cards
router.get('/', getCards);

// @route   GET /api/cards/:id
router.get(
  '/:id',
  [check('id', 'Invalid card ID').isMongoId()],
  validate,
  getCardById
);

// @route   PUT /api/cards/:id/status
router.put(
  '/:id/status',
  [
    check('id', 'Invalid card ID').isMongoId(),
    check('status', 'Status must be Active, Blocked, or Inactive').isIn(['Active', 'Blocked', 'Inactive']),
  ],
  validate,
  updateCardStatus
);

// @route   PUT /api/cards/:id/pin
router.put(
  '/:id/pin',
  [
    check('id', 'Invalid card ID').isMongoId(),
    check('newPin', 'New PIN must be exactly 4 numeric digits').isNumeric().isLength({ min: 4, max: 4 }),
    check('confirmPin', 'Confirm PIN must be exactly 4 numeric digits').isNumeric().isLength({ min: 4, max: 4 }),
  ],
  validate,
  changePin
);

// @route   PUT /api/cards/:id/limit
router.put(
  '/:id/limit',
  [
    check('id', 'Invalid card ID').isMongoId(),
    check('transactionLimit', 'Daily transaction limit must be between $50 and $10,000')
      .isFloat({ min: 50, max: 10000 }),
  ],
  validate,
  setTransactionLimit
);

module.exports = router;
