const express = require('express');
const { check, validationResult } = require('express-validator');
const {
  applyLoan,
  getLoans,
  getLoanById,
} = require('../controllers/loanController');
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

// All loan routes require authentication
router.use(protect);

// @route   POST /api/loans
router.post(
  '/',
  [
    check('loanType', 'Please select a valid loan type (Personal, Education, Home, Vehicle)')
      .isIn(['Personal', 'Education', 'Home', 'Vehicle']),
    check('amount', 'Loan amount must be at least $500')
      .isFloat({ min: 500 }),
    check('tenure', 'Tenure must be between 3 and 360 months')
      .isInt({ min: 3, max: 360 }),
    check('interestRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Interest rate cannot be negative'),
    check('annualIncome')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Annual income cannot be negative'),
    check('employmentStatus')
      .optional()
      .isIn(['Employed', 'Self-Employed', 'Business', 'Student', 'Other'])
      .withMessage('Invalid employment status'),
  ],
  validate,
  applyLoan
);

// @route   GET /api/loans
router.get('/', getLoans);

// @route   GET /api/loans/:id
router.get(
  '/:id',
  [check('id', 'Invalid loan ID').isMongoId()],
  validate,
  getLoanById
);

module.exports = router;
