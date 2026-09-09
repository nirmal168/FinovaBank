const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getAdminRequests,
  getAdminRequestById,
  approveRequest,
  rejectRequest,
} = require('../controllers/depositWithdrawalController');
const { protect, adminMiddleware } = require('../middleware/authMiddleware');

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

// ==========================================
// CUSTOMER ROUTER
// Base: /api/deposit-withdrawal-requests
// ==========================================
const customerRouter = express.Router();

customerRouter.use(protect);

// POST /api/deposit-withdrawal-requests - Customer submits deposit/withdrawal request
customerRouter.post(
  '/',
  [
    body('type')
      .notEmpty()
      .withMessage('Request type is required')
      .custom((value) => {
        if (!['DEPOSIT', 'WITHDRAWAL', 'deposit', 'withdrawal'].includes(value)) {
          throw new Error('Type must be either DEPOSIT or WITHDRAWAL');
        }
        return true;
      }),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
  ],
  handleValidation,
  createRequest
);

// GET /api/deposit-withdrawal-requests - View own requests
customerRouter.get('/', getMyRequests);

// GET /api/deposit-withdrawal-requests/:id - View single request details
customerRouter.get('/:id', getRequestById);

// PUT /api/deposit-withdrawal-requests/:id/cancel - Cancel pending request
customerRouter.put('/:id/cancel', cancelRequest);

// ==========================================
// ADMIN ROUTER
// Base: /api/admin/deposit-withdrawal-requests
// ==========================================
const adminRouter = express.Router();

adminRouter.use(protect);
adminRouter.use(adminMiddleware);

// GET /api/admin/deposit-withdrawal-requests - List all requests with filters & metrics
adminRouter.get('/', getAdminRequests);

// GET /api/admin/deposit-withdrawal-requests/:id - Get request details
adminRouter.get('/:id', getAdminRequestById);

// POST /api/admin/deposit-withdrawal-requests/:id/approve - Approve request
adminRouter.post(
  '/:id/approve',
  [
    body('adminNote')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Admin note cannot exceed 500 characters'),
  ],
  handleValidation,
  approveRequest
);

// POST /api/admin/deposit-withdrawal-requests/:id/reject - Reject request
adminRouter.post(
  '/:id/reject',
  [
    body('adminNote')
      .optional()
      .trim(),
    body('reason')
      .optional()
      .trim(),
    body().custom((val) => {
      const note = val.adminNote || val.reason;
      if (!note || !note.trim()) {
        throw new Error('Rejection reason or admin note is required');
      }
      return true;
    }),
  ],
  handleValidation,
  rejectRequest
);

module.exports = {
  customerRouter,
  adminRouter,
};
