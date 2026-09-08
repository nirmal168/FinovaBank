const express = require('express');
const {
  getDashboardStats,
  getAdminCustomers,
  updateCustomerStatus,
  getAdminAccounts,
  updateAccountStatus,
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
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict RBAC: All admin routes require authenticated JWT and role 'admin'
router.use(protect);
router.use(authorize('admin'));

// Dashboard metrics
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);

// Customer management
router.get('/customers', getAdminCustomers);
router.put('/customers/:id/status', updateCustomerStatus);

// Account management
router.get('/accounts', getAdminAccounts);
router.put('/accounts/:id/status', updateAccountStatus);

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

