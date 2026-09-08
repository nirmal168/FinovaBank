const express = require('express');
const {
  applyChequeBook,
  getCustomerChequeBooks,
  applyPassbook,
  getCustomerPassbooks,
  getAdminChequeBooks,
  processChequeBook,
  getAdminPassbooks,
  processPassbook,
} = require('../controllers/serviceRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer endpoints
router.post('/cheque-books', applyChequeBook);
router.get('/cheque-books', getCustomerChequeBooks);
router.post('/passbooks', applyPassbook);
router.get('/passbooks', getCustomerPassbooks);

// Admin review & approval endpoints
router.get('/admin/cheque-books', authorize('admin'), getAdminChequeBooks);
router.put('/admin/cheque-books/:id', authorize('admin'), processChequeBook);
router.get('/admin/passbooks', authorize('admin'), getAdminPassbooks);
router.put('/admin/passbooks/:id', authorize('admin'), processPassbook);

module.exports = router;
