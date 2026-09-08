const express = require('express');
const {
  getDashboardStats,
  getAdminCustomers,
  createAdminCustomer,
  getAdminCustomerById,
  resetCustomerPassword,
  updateCustomerStatus,
  getAdminAccounts,
  updateAccountStatus,
  getAdminCards,
  issueAdminCard,
  updateAdminCardStatus,
  updateAdminCardLimit,
  getAdminTransactions,
  getAdminLoans,
  approveLoan,
  rejectLoan,
  getAdminFraudAlerts,
  getAdminFraudAlertById,
  resolveFraudAlert,
  dismissFraudAlert,
  getAdminAuditLogs,
  getAdminAuditLogById,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Strict RBAC: All admin routes require authenticated JWT and role 'admin'
router.use(protect);
router.use(adminMiddleware);

// Dashboard metrics
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);

// Customer management
router.get('/customers', getAdminCustomers);
router.post('/customers', createAdminCustomer);
router.get('/customers/:id', getAdminCustomerById);
router.post('/customers/:id/reset-password', resetCustomerPassword);
router.put('/customers/:id/status', updateCustomerStatus);

// Account management
router.get('/accounts', getAdminAccounts);
router.put('/accounts/:id/status', updateAccountStatus);

// Card management & issuance
router.get('/cards', getAdminCards);
router.post('/cards', issueAdminCard);
router.put('/cards/:id/status', updateAdminCardStatus);
router.put('/cards/:id/limit', updateAdminCardLimit);

// Transaction audit & monitoring
router.get('/transactions', getAdminTransactions);

// Loan application reviews & decisions
router.get('/loans', getAdminLoans);
router.put('/loans/:id/approve', approveLoan);
router.put('/loans/:id/reject', rejectLoan);

// Fraud detection & alert review
router.get('/fraud-alerts', getAdminFraudAlerts);
router.get('/fraud-alerts/:id', getAdminFraudAlertById);
router.put('/fraud-alerts/:id/resolve', resolveFraudAlert);
router.put('/fraud-alerts/:id/dismiss', dismissFraudAlert);

// Audit logs & activity trail
router.get('/audit-logs', getAdminAuditLogs);
router.get('/audit-logs/:id', getAdminAuditLogById);

module.exports = router;

