const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  addBeneficiary,
  getBeneficiaries,
  updateBeneficiary,
  deleteBeneficiary,
} = require('../controllers/beneficiaryController');
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

// All beneficiary routes are protected
router.use(protect);

// @route   POST /api/beneficiaries - Add a new beneficiary
router.post(
  '/',
  [
    body('name')
      .notEmpty()
      .withMessage('Beneficiary name is required')
      .trim()
      .isLength({ max: 70 })
      .withMessage('Name cannot exceed 70 characters'),
    body('accountNumber')
      .notEmpty()
      .withMessage('Account number is required')
      .trim(),
    body('bankName')
      .optional()
      .trim(),
    body('nickname')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Nickname cannot exceed 50 characters'),
  ],
  handleValidation,
  addBeneficiary
);

// @route   GET /api/beneficiaries - List user's beneficiaries
router.get('/', getBeneficiaries);

// @route   PUT /api/beneficiaries/:id - Edit beneficiary details or toggle status
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 70 })
      .withMessage('Name cannot exceed 70 characters'),
    body('accountNumber')
      .optional()
      .trim(),
    body('nickname')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Nickname cannot exceed 50 characters'),
    body('status')
      .optional()
      .custom((value) => {
        if (!['Active', 'Inactive', 'active', 'inactive'].includes(value)) {
          throw new Error('Status must be Active or Inactive');
        }
        return true;
      }),
  ],
  handleValidation,
  updateBeneficiary
);

// @route   DELETE /api/beneficiaries/:id - Remove a beneficiary
router.delete('/:id', deleteBeneficiary);

module.exports = router;
