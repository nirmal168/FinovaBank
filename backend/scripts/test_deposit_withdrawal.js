const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { app, server } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const DepositWithdrawalRequest = require('../models/DepositWithdrawalRequest');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

let baseUrl = 'http://localhost:5000/api';

async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method: method.toUpperCase(),
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  FINOVA: DEPOSIT & WITHDRAWAL MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  try {
    // Wait for DB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }

    // 1. Authenticate Admin and Customer
    console.log('--- TEST GROUP 1: Authentication ---');
    const adminLogin = await req('POST', '/auth/login', {
      identifier: 'admin@finova.com',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logged in successfully');
    const adminToken = adminLogin.data.token;

    const customerLogin = await req('POST', '/auth/login', {
      identifier: 'customer@finova.com',
      password: 'password123',
    });
    assert(customerLogin.status === 200 && customerLogin.data.token, 'Customer logged in successfully');
    const customerToken = customerLogin.data.token;

    // Get customer's account and initial balance
    const accountsRes = await req('GET', '/accounts', null, customerToken);
    assert(accountsRes.status === 200 && accountsRes.data.accounts.length > 0, 'Customer accounts retrieved');
    const customerAccount = accountsRes.data.accounts[0];
    const initialBalance = customerAccount.balance;
    console.log(`  [INFO] Customer Account #${customerAccount.accountNumber} Initial Balance: ₹${initialBalance.toFixed(2)}`);

    // 2. Validation & Security Checks
    console.log('\n--- TEST GROUP 2: Validation & IDOR Protection ---');

    // Negative amount
    const negRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'DEPOSIT',
      amount: -500,
    }, customerToken);
    assert(negRes.status === 400, 'Rejects negative amount with 400');

    // Zero amount
    const zeroRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'DEPOSIT',
      amount: 0,
    }, customerToken);
    assert(zeroRes.status === 400, 'Rejects zero amount with 400');

    // Invalid type
    const invalidTypeRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'INVALID_TYPE',
      amount: 1000,
    }, customerToken);
    assert(invalidTypeRes.status === 400, 'Rejects invalid request type with 400');

    // Customer calling Admin endpoint (RBAC check)
    const rbacRes = await req('GET', '/admin/deposit-withdrawal-requests', null, customerToken);
    assert(rbacRes.status === 403, 'Customer cannot access admin requests endpoint (403 Forbidden)');

    // Excessive withdrawal beyond current balance
    const excessWithdrawRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'WITHDRAWAL',
      amount: initialBalance + 500000,
    }, customerToken);
    assert(excessWithdrawRes.status === 400, 'Rejects withdrawal exceeding available balance at request time (400)');

    // 3. Customer Creates Deposit Request
    console.log('\n--- TEST GROUP 3: Customer Deposit Request Flow ---');
    const depositAmount = 25000;
    const depositRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'DEPOSIT',
      amount: depositAmount,
      description: 'Counter cash deposit test',
    }, customerToken);

    assert(depositRes.status === 201, 'Deposit request created with 201 Created');
    assert(depositRes.data.message === 'Your request has been submitted for admin approval.', 'Correct confirmation message');
    assert(depositRes.data.request.status === 'PENDING', 'Request status is PENDING');
    assert(depositRes.data.request.type === 'DEPOSIT', 'Request type is DEPOSIT');
    assert(depositRes.data.request.requestId.startsWith('FIN-REQ-'), 'Request ID has FIN-REQ- format');

    const depositRequestId = depositRes.data.request._id;
    const depositReqCode = depositRes.data.request.requestId;

    // Verify balance is NOT modified
    const balanceCheck1 = await req('GET', `/accounts/${customerAccount._id}`, null, customerToken);
    assert(balanceCheck1.data.account.balance === initialBalance, `Customer balance remains untouched (₹${balanceCheck1.data.account.balance})`);

    // 4. Customer Request History & Cancellation
    console.log('\n--- TEST GROUP 4: Customer Request History & Cancellation ---');
    const myRequestsRes = await req('GET', '/deposit-withdrawal-requests', null, customerToken);
    assert(myRequestsRes.status === 200, 'Customer retrieved request history');
    assert(myRequestsRes.data.requests.some((r) => r.requestId === depositReqCode), 'Submitted deposit request appears in history');

    // Create a temporary request and cancel it
    const tempReqRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'DEPOSIT',
      amount: 500,
      description: 'Will cancel this request',
    }, customerToken);
    const tempId = tempReqRes.data.request._id;

    const cancelRes = await req('PUT', `/deposit-withdrawal-requests/${tempId}/cancel`, {}, customerToken);
    assert(cancelRes.status === 200 && cancelRes.data.request.status === 'CANCELLED', 'Customer successfully cancelled pending request');

    // Attempting to cancel already cancelled request should fail
    const reCancelRes = await req('PUT', `/deposit-withdrawal-requests/${tempId}/cancel`, {}, customerToken);
    assert(reCancelRes.status === 400, 'Cannot cancel non-pending request (400)');

    // Customer cannot call approve endpoint
    const customerApproveAttempt = await req('POST', `/admin/deposit-withdrawal-requests/${depositRequestId}/approve`, {}, customerToken);
    assert(customerApproveAttempt.status === 403, 'Customer cannot call admin approve endpoint (403 Forbidden)');

    // 5. Admin Approves Deposit Request
    console.log('\n--- TEST GROUP 5: Admin Approves Deposit ---');
    const adminReqList = await req('GET', '/admin/deposit-withdrawal-requests', null, adminToken);
    assert(adminReqList.status === 200, 'Admin fetched all deposit & withdrawal requests');
    assert(adminReqList.data.summary.pendingDeposits >= 1, 'Admin summary shows pending deposits');

    const approveDepositRes = await req('POST', `/admin/deposit-withdrawal-requests/${depositRequestId}/approve`, {
      adminNote: 'Cash verified and accepted at counter.',
    }, adminToken);

    assert(approveDepositRes.status === 200, 'Admin approved deposit request (200 OK)');
    assert(approveDepositRes.data.request.status === 'APPROVED', 'Request status updated to APPROVED');
    assert(approveDepositRes.data.transaction?.type === 'DEPOSIT', 'Transaction record generated with type DEPOSIT');
    assert(approveDepositRes.data.transaction?.status === 'COMPLETED', 'Transaction status is COMPLETED');

    const expectedBalanceAfterDeposit = parseFloat((initialBalance + depositAmount).toFixed(2));
    assert(approveDepositRes.data.newBalance === expectedBalanceAfterDeposit, `Balance updated accurately: ₹${initialBalance} + ₹${depositAmount} = ₹${expectedBalanceAfterDeposit}`);

    // Verify account balance in database
    const balanceCheck2 = await req('GET', `/accounts/${customerAccount._id}`, null, customerToken);
    assert(balanceCheck2.data.account.balance === expectedBalanceAfterDeposit, `Database account balance verified: ₹${balanceCheck2.data.account.balance}`);

    // Verify customer notification exists
    const notifs = await Notification.find({ user: customerAccount.user }).sort({ createdAt: -1 }).limit(1);
    assert(notifs.length > 0 && notifs[0].type === 'DEPOSIT', 'Deposit approved notification generated for customer');

    // Verify institutional audit log exists
    const audit = await AuditLog.findOne({ entityId: depositRequestId.toString(), action: 'ADMIN_APPROVED_DEPOSIT' });
    assert(audit !== null, 'Institutional audit log ADMIN_APPROVED_DEPOSIT recorded');

    // 6. Double Approval Protection
    console.log('\n--- TEST GROUP 6: Double-Approval Protection ---');
    const doubleApproveRes = await req('POST', `/admin/deposit-withdrawal-requests/${depositRequestId}/approve`, {
      adminNote: 'Attempting duplicate approval',
    }, adminToken);
    assert(doubleApproveRes.status === 400, 'Rejects duplicate approval of already approved request (400)');
    assert(doubleApproveRes.data.message === 'This request has already been processed.', 'Returns "This request has already been processed." message');

    // 7. Customer Creates Withdrawal Request
    console.log('\n--- TEST GROUP 7: Customer Withdrawal Request Flow ---');
    const withdrawAmount = 10000;
    const withdrawReqRes = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      description: 'Cash withdrawal test',
    }, customerToken);

    assert(withdrawReqRes.status === 201, 'Withdrawal request created with 201 Created');
    assert(withdrawReqRes.data.request.status === 'PENDING', 'Withdrawal status is PENDING');
    const withdrawRequestId = withdrawReqRes.data.request._id;

    // Verify balance is NOT debited yet
    const balanceCheck3 = await req('GET', `/accounts/${customerAccount._id}`, null, customerToken);
    assert(balanceCheck3.data.account.balance === expectedBalanceAfterDeposit, `Balance is NOT debited upon request creation (remains ₹${balanceCheck3.data.account.balance})`);

    // 8. Admin Approves Withdrawal Request
    console.log('\n--- TEST GROUP 8: Admin Approves Withdrawal ---');
    const approveWithdrawRes = await req('POST', `/admin/deposit-withdrawal-requests/${withdrawRequestId}/approve`, {
      adminNote: 'Cash dispensed at teller counter.',
    }, adminToken);

    assert(approveWithdrawRes.status === 200, 'Admin approved withdrawal request (200 OK)');
    assert(approveWithdrawRes.data.request.status === 'APPROVED', 'Request status updated to APPROVED');

    const expectedBalanceAfterWithdrawal = parseFloat((expectedBalanceAfterDeposit - withdrawAmount).toFixed(2));
    assert(approveWithdrawRes.data.newBalance === expectedBalanceAfterWithdrawal, `Balance debited accurately: ₹${expectedBalanceAfterDeposit} - ₹${withdrawAmount} = ₹${expectedBalanceAfterWithdrawal}`);

    // Verify in database
    const balanceCheck4 = await req('GET', `/accounts/${customerAccount._id}`, null, customerToken);
    assert(balanceCheck4.data.account.balance === expectedBalanceAfterWithdrawal, `Database account balance verified: ₹${balanceCheck4.data.account.balance}`);

    // 9. Admin Rejection Flow
    console.log('\n--- TEST GROUP 9: Admin Rejection Flow ---');
    const rejectTestReq = await req('POST', '/deposit-withdrawal-requests', {
      accountId: customerAccount._id,
      type: 'WITHDRAWAL',
      amount: 2000,
      description: 'Request to test rejection',
    }, customerToken);
    const rejectRequestId = rejectTestReq.data.request._id;

    // Try rejecting without reason -> should fail
    const rejectNoReason = await req('POST', `/admin/deposit-withdrawal-requests/${rejectRequestId}/reject`, {
      adminNote: '',
    }, adminToken);
    assert(rejectNoReason.status === 400, 'Rejection without reason is rejected with 400');

    // Reject with reason
    const rejectionReason = 'Required verification documents were not provided.';
    const rejectSuccess = await req('POST', `/admin/deposit-withdrawal-requests/${rejectRequestId}/reject`, {
      adminNote: rejectionReason,
    }, adminToken);
    assert(rejectSuccess.status === 200, 'Admin rejected request successfully (200 OK)');
    assert(rejectSuccess.data.request.status === 'REJECTED', 'Status updated to REJECTED');

    // Verify balance is untouched
    const balanceCheck5 = await req('GET', `/accounts/${customerAccount._id}`, null, customerToken);
    assert(balanceCheck5.data.account.balance === expectedBalanceAfterWithdrawal, `Customer balance remains unchanged after rejection (₹${balanceCheck5.data.account.balance})`);

    // Verify rejection audit log
    const rejectAudit = await AuditLog.findOne({ entityId: rejectRequestId.toString(), action: 'ADMIN_REJECTED_WITHDRAWAL' });
    assert(rejectAudit !== null, 'Audit log ADMIN_REJECTED_WITHDRAWAL recorded');

    // 10. Summary Results
    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
