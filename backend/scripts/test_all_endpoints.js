const API_BASE = 'http://localhost:5000/api';
const ROOT_URL = 'http://localhost:5000';

async function req(method, path, body = null, token = null) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method: method.toUpperCase(),
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('================================================================');
  console.log('  FINOVA BANK — COMPLETE ENDPOINT & BUG AUDIT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const issues = [];

  function test(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? `-> ${details}` : ''}`);
      failed++;
      issues.push({ name, details });
    }
  }

  try {
    // 1. Root & Health
    console.log('--- 1. System Health & Infrastructure ---');
    const rootRes = await req('GET', `${ROOT_URL}/`);
    test(rootRes.status === 200 && rootRes.data?.version, 'GET / (Root Welcome)');

    const healthRes = await req('GET', '/health');
    test(
      healthRes.status === 200 && healthRes.data?.database?.status === 'connected',
      'GET /api/health (Database Connected & API Operational)'
    );

    // 2. Authentication & Provisioning
    console.log('\n--- 2. Authentication & Admin-Provisioned Registration ---');
    const regRes = await req('POST', '/auth/register', { email: 'fake@test.com' });
    test(regRes.status === 403, 'POST /api/auth/register (403 Self-Registration Disabled)');

    // Admin login
    const adminLogin = await req('POST', '/auth/login', {
      identifier: 'admin@finova.com',
      password: 'admin123'
    });
    test(adminLogin.status === 200 && adminLogin.data?.token, 'POST /api/auth/login (Admin Login)');
    const adminToken = adminLogin.data?.token;

    // Admin creates customer
    const testEmail = `audit_cust_${Date.now()}@finova.test`;
    const createCustRes = await req('POST', '/admin/customers', {
      name: 'Rohan Verma',
      email: testEmail,
      phone: '9811223344',
      initialDeposit: 25000,
      accountType: 'Savings'
    }, adminToken);
    test(
      createCustRes.status === 201 && createCustRes.data?.customer?.customerId,
      'POST /api/admin/customers (Admin Provisions Customer with Auto CustomerId)',
      JSON.stringify(createCustRes.data)
    );
    const customerId = createCustRes.data?.customer?.customerId;
    const tempPassword = createCustRes.data?.temporaryPassword || createCustRes.data?.credentials?.temporaryPassword;
    const customerAccountNum = createCustRes.data?.account?.accountNumber || createCustRes.data?.credentials?.accountNumber;
    const customerAccountId = createCustRes.data?.account?._id || createCustRes.data?.account?.id;
    const customerUserId = createCustRes.data?.customer?._id || createCustRes.data?.customer?.id;

    // Customer login with Customer ID
    const custLogin = await req('POST', '/auth/login', {
      identifier: customerId,
      password: tempPassword
    });
    test(
      custLogin.status === 200 && custLogin.data?.user?.mustChangePassword === true,
      `POST /api/auth/login (Customer Login via Customer ID: ${customerId})`
    );
    let customerToken = custLogin.data?.token;

    // Customer rotates password
    const newPassword = 'SecurePassword@2026';
    const changePassRes = await req('PUT', '/auth/change-password', {
      currentPassword: tempPassword,
      newPassword
    }, customerToken);
    test(changePassRes.status === 200, 'PUT /api/auth/change-password (Mandatory First Password Change)');

    // Relogin customer with new password
    const custRelogin = await req('POST', '/auth/login', {
      identifier: testEmail,
      password: newPassword
    });
    test(
      custRelogin.status === 200 && custRelogin.data?.user?.mustChangePassword === false,
      'POST /api/auth/login (Customer Login with New Password, mustChangePassword=false)'
    );
    customerToken = custRelogin.data?.token;

    // GET /api/auth/me
    const meRes = await req('GET', '/auth/me', null, customerToken);
    test(meRes.status === 200 && meRes.data?.user?.email === testEmail, 'GET /api/auth/me (User Profile Retrieval)');

    // PUT /api/auth/profile
    const updateProfileRes = await req('PUT', '/auth/profile', {
      name: 'Rohan Verma Updated',
      phone: '9811223399'
    }, customerToken);
    test(updateProfileRes.status === 200 && updateProfileRes.data?.user?.name === 'Rohan Verma Updated', 'PUT /api/auth/profile (Update Profile)');

    // 3. Accounts Endpoints
    console.log('\n--- 3. Account Management Endpoints ---');
    const accountsRes = await req('GET', '/accounts', null, customerToken);
    test(accountsRes.status === 200 && accountsRes.data?.accounts?.length >= 1, 'GET /api/accounts (List Customer Accounts)');

    // Verify customer cannot create account directly (403 Forbidden)
    const custCreateAccRes = await req('POST', '/accounts', {
      accountType: 'Current',
      initialDeposit: 5000
    }, customerToken);
    test(custCreateAccRes.status === 403, 'POST /api/accounts (403 Customer Prohibited from Self-Creating Account)');

    // Admin creates secondary Current account for customer
    const newAccountRes = await req('POST', '/accounts', {
      accountType: 'Current',
      initialDeposit: 5000,
      userId: customerUserId
    }, adminToken);
    test(newAccountRes.status === 201 && newAccountRes.data?.account?.accountNumber, 'POST /api/accounts (Admin Creates Secondary Account for Customer)');
    const secondAccount = newAccountRes.data?.account;

    // GET /api/accounts/:id
    const accByIdRes = await req('GET', `/accounts/${secondAccount.id || secondAccount._id}`, null, customerToken);
    test(accByIdRes.status === 200 && accByIdRes.data?.account?.accountType === 'Current', 'GET /api/accounts/:id (Get Account by ID)');

    // GET /api/accounts/lookup/:accountNumber
    const lookupRes = await req('GET', `/accounts/lookup/${customerAccountNum}`, null, customerToken);
    test(lookupRes.status === 200 && lookupRes.data?.account?.accountNumber === customerAccountNum, 'GET /api/accounts/lookup/:accountNumber (Recipient Lookup)');

    // PUT /api/accounts/:id/status (Freeze then Unfreeze)
    const freezeAcc = await req('PUT', `/accounts/${secondAccount.id || secondAccount._id}/status`, { status: 'Frozen' }, customerToken);
    test(freezeAcc.status === 200 && freezeAcc.data?.account?.status === 'Frozen', 'PUT /api/accounts/:id/status (Freeze Account)');

    const unfreezeAcc = await req('PUT', `/accounts/${secondAccount.id || secondAccount._id}/status`, { status: 'Active' }, customerToken);
    test(unfreezeAcc.status === 200 && unfreezeAcc.data?.account?.status === 'Active', 'PUT /api/accounts/:id/status (Unfreeze Account)');

    // 4. Transactions Endpoints
    console.log('\n--- 4. Transactions & Funds Movement ---');
    // Customer deposit rejected (403 - Teller/Branch Only)
    const custDepReject = await req('POST', '/transactions/deposit', {
      accountNumber: customerAccountNum,
      amount: 1000,
    }, customerToken);
    test(custDepReject.status === 403, 'POST /api/transactions/deposit (403 Customer Direct Deposit Prohibited)');

    // Admin-initiated Teller Deposit
    const depRes = await req('POST', '/transactions/deposit', {
      accountNumber: customerAccountNum,
      amount: 1000,
      description: 'Audit Test Deposit'
    }, adminToken);
    test(depRes.status === 200 && depRes.data?.transaction?.amount === 1000, 'POST /api/transactions/deposit (Admin Teller Deposit)');

    // Customer withdrawal rejected (403 - ATM/Teller Only)
    const custWithReject = await req('POST', '/transactions/withdraw', {
      accountNumber: customerAccountNum,
      amount: 500,
    }, customerToken);
    test(custWithReject.status === 403, 'POST /api/transactions/withdraw (403 Customer Direct Withdrawal Prohibited)');

    // Admin-initiated Teller Withdrawal
    const withRes = await req('POST', '/transactions/withdraw', {
      accountNumber: customerAccountNum,
      amount: 500,
      description: 'Audit Test Withdrawal'
    }, adminToken);
    test(withRes.status === 200 && withRes.data?.transaction?.amount === 500, 'POST /api/transactions/withdraw (Admin Teller Withdrawal)');

    // Transfer between own accounts or to demo customer
    const transRes = await req('POST', '/transactions/transfer', {
      senderAccountNumber: customerAccountNum,
      receiverAccountNumber: secondAccount.accountNumber,
      amount: 750,
      description: 'Internal Transfer Test'
    }, customerToken);
    test(transRes.status === 200 && transRes.data?.transaction?.amount === 750, 'POST /api/transactions/transfer (Execute Transfer)');

    // Bank Statement Generation
    const stmtRes = await req('GET', `/transactions/statement?accountNumber=${customerAccountNum}`, null, customerToken);
    test(
      stmtRes.status === 200 && stmtRes.data?.success && stmtRes.data?.data?.summary,
      'GET /api/transactions/statement (Official Bank Statement Retrieval)'
    );

    // GET /api/transactions
    const txListRes = await req('GET', '/transactions', null, customerToken);
    test(txListRes.status === 200 && txListRes.data?.transactions?.length >= 1, 'GET /api/transactions (Paginated Transactions List)');

    // GET /api/transactions/account
    const txAccRes = await req('GET', '/transactions/account', null, customerToken);
    test(txAccRes.status === 200 && txAccRes.data?.account?.accountNumber, 'GET /api/transactions/account (Primary Account Summary)');

    // GET /api/transactions/history
    const txHistRes = await req('GET', '/transactions/history', null, customerToken);
    test(txHistRes.status === 200 && Array.isArray(txHistRes.data?.transactions), 'GET /api/transactions/history (Recent History)');

    // GET /api/transactions/:id
    const sampleTxId = txListRes.data?.transactions[0]?._id;
    if (sampleTxId) {
      const singleTxRes = await req('GET', `/transactions/${sampleTxId}`, null, customerToken);
      test(singleTxRes.status === 200 && singleTxRes.data?.transaction, 'GET /api/transactions/:id (Get Transaction Details)');
    }

    // 5. Beneficiary Management
    console.log('\n--- 5. Beneficiary Management ---');
    const addOwnRes = await req('POST', '/beneficiaries', {
      name: 'Myself',
      accountNumber: customerAccountNum,
      bankName: 'Finova Bank'
    }, customerToken);
    test(addOwnRes.status === 400, 'POST /api/beneficiaries (Rejects Adding Own Account with 400)');

    // Fetch an external account to add as beneficiary
    const allAccountsRes = await req('GET', '/accounts?all=true', null, adminToken);
    const externalAccount = allAccountsRes.data?.accounts?.find(a => a.user?.toString() !== customerUserId?.toString())?.accountNumber || '408226272580';

    const addBenRes = await req('POST', '/beneficiaries', {
      name: 'Pooja Hegde',
      accountNumber: externalAccount,
      bankName: 'Finova Bank',
      nickname: 'Pooja Savings'
    }, customerToken);
    test(addBenRes.status === 201 && addBenRes.data?.beneficiary?.name === 'Pooja Hegde', 'POST /api/beneficiaries (Add External Beneficiary)');
    const benId = addBenRes.data?.beneficiary?._id;

    // GET /api/beneficiaries
    const benListRes = await req('GET', '/beneficiaries', null, customerToken);
    test(benListRes.status === 200 && benListRes.data?.beneficiaries?.length >= 1, 'GET /api/beneficiaries (List Beneficiaries)');

    // PUT /api/beneficiaries/:id
    if (benId) {
      const updateBenRes = await req('PUT', `/beneficiaries/${benId}`, {
        nickname: 'Pooja Updated'
      }, customerToken);
      test(updateBenRes.status === 200 && updateBenRes.data?.beneficiary?.nickname === 'Pooja Updated', 'PUT /api/beneficiaries/:id (Update Beneficiary)');

      // DELETE /api/beneficiaries/:id
      const delBenRes = await req('DELETE', `/beneficiaries/${benId}`, null, customerToken);
      test(delBenRes.status === 200, 'DELETE /api/beneficiaries/:id (Remove Beneficiary)');
    }

    // 6. Virtual Cards
    console.log('\n--- 6. Virtual Debit Cards ---');
    const applyCardRes = await req('POST', '/cards/apply', {
      cardType: 'Visa Platinum Debit',
      pin: '4321',
      transactionLimit: 30000,
      accountId: customerAccountNum // tested with accountNumber as resolved earlier!
    }, customerToken);
    test(applyCardRes.status === 201 && applyCardRes.data?.card?.maskedCardNumber, 'POST /api/cards/apply (Virtual Debit Card Issuance)');
    const cardId = applyCardRes.data?.card?._id;

    if (cardId) {
      // GET /api/cards
      const cardsRes = await req('GET', '/cards', null, customerToken);
      test(cardsRes.status === 200 && cardsRes.data?.cards?.length >= 1, 'GET /api/cards (List Virtual Cards)');

      // GET /api/cards/:id
      const cardByIdRes = await req('GET', `/cards/${cardId}`, null, customerToken);
      test(cardByIdRes.status === 200 && cardByIdRes.data?.card, 'GET /api/cards/:id (Get Card Details)');

      // PUT /api/cards/:id/limit
      const updateLimitRes = await req('PUT', `/cards/${cardId}/limit`, {
        transactionLimit: 45000
      }, customerToken);
      test(updateLimitRes.status === 200 && updateLimitRes.data?.card?.transactionLimit === 45000, 'PUT /api/cards/:id/limit (Adjust Card Limit)');

      // PUT /api/cards/:id/pin
      const changePinRes = await req('PUT', `/cards/${cardId}/pin`, {
        newPin: '9876',
        confirmPin: '9876'
      }, customerToken);
      test(changePinRes.status === 200, 'PUT /api/cards/:id/pin (Update Card PIN)');

      // PUT /api/cards/:id/status
      const blockCardRes = await req('PUT', `/cards/${cardId}/status`, {
        status: 'Blocked'
      }, customerToken);
      test(blockCardRes.status === 200 && blockCardRes.data?.card?.status === 'Blocked', 'PUT /api/cards/:id/status (Block Card)');
    }

    // 7. Loans Management
    console.log('\n--- 7. Institutional Loan Applications ---');
    const applyLoanRes = await req('POST', '/loans', {
      loanType: 'Personal',
      amount: 100000,
      tenure: 24,
      purpose: 'Home Renovation',
      annualIncome: 900000,
      employmentStatus: 'Employed'
    }, customerToken);
    test(applyLoanRes.status === 201 && applyLoanRes.data?.loan?.amount === 100000, 'POST /api/loans (Submit Loan Application)');
    const loanId = applyLoanRes.data?.loan?._id;

    if (loanId) {
      // GET /api/loans
      const loansRes = await req('GET', '/loans', null, customerToken);
      test(loansRes.status === 200 && loansRes.data?.loans?.length >= 1, 'GET /api/loans (List User Loans)');

      // GET /api/loans/:id
      const loanByIdRes = await req('GET', `/loans/${loanId}`, null, customerToken);
      test(loanByIdRes.status === 200 && loanByIdRes.data?.loan?.emi, 'GET /api/loans/:id (Get Loan Details & EMI Breakdown)');

      // Admin reviews & approves loan
      const approveLoanRes = await req('PUT', `/admin/loans/${loanId}/approve`, {}, adminToken);
      test(approveLoanRes.status === 200 && approveLoanRes.data?.data?.status === 'Approved', 'PUT /api/admin/loans/:id/approve (Admin Approves Loan)');
    }

    // 8. Notifications & Alerts
    console.log('\n--- 8. In-App Notifications ---');
    const notifsRes = await req('GET', '/notifications', null, customerToken);
    const notifsList = notifsRes.data?.notifications || notifsRes.data?.data?.notifications;
    test(notifsRes.status === 200 && Array.isArray(notifsList), 'GET /api/notifications (List Notifications)');

    const markAllRes = await req('PUT', '/notifications/read-all', {}, customerToken);
    test(markAllRes.status === 200, 'PUT /api/notifications/read-all (Mark All Notifications Read)');

    // 9. OTP System
    console.log('\n--- 9. One-Time Password (OTP) Verification Engine ---');
    const otpReqRes = await req('POST', '/otp/request', {
      purpose: 'TRANSACTION_CONFIRMATION',
      email: testEmail
    }, customerToken);
    test(otpReqRes.status === 200 && otpReqRes.data?.success, 'POST /api/otp/request (Request OTP)');

    // Verify OTP format and validation
    const otpVerifyFail = await req('POST', '/otp/verify', {
      otp: '000000',
      purpose: 'TRANSACTION_CONFIRMATION',
      email: testEmail
    }, customerToken);
    test(otpVerifyFail.status === 400, 'POST /api/otp/verify (Rejects Invalid OTP With 400)');

    // 10. Admin Endpoints
    console.log('\n--- 10. Admin Console & Compliance Oversight ---');
    const adminDash = await req('GET', '/admin/dashboard', null, adminToken);
    test(
      adminDash.status === 200 && (adminDash.data?.data?.statistics || adminDash.data?.data?.kpis || adminDash.data?.data?.metrics),
      'GET /api/admin/dashboard (Dashboard KPIs & Telemetry)'
    );

    const adminStats = await req('GET', '/admin/stats', null, adminToken);
    test(adminStats.status === 200, 'GET /api/admin/stats (Admin Stats)');

    const adminCusts = await req('GET', '/admin/customers', null, adminToken);
    test(adminCusts.status === 200 && Array.isArray(adminCusts.data?.data?.customers), 'GET /api/admin/customers (Admin Customer List)');

    const adminCustById = await req('GET', `/admin/customers/${customerUserId}`, null, adminToken);
    test(adminCustById.status === 200 && (adminCustById.data?.customer || adminCustById.data?.data?.customer), 'GET /api/admin/customers/:id (Admin Single Customer)');

    const adminAccs = await req('GET', '/admin/accounts', null, adminToken);
    test(adminAccs.status === 200 && Array.isArray(adminAccs.data?.data?.accounts), 'GET /api/admin/accounts (Admin All Accounts)');

    const adminTxs = await req('GET', '/admin/transactions', null, adminToken);
    test(adminTxs.status === 200 && Array.isArray(adminTxs.data?.data?.transactions), 'GET /api/admin/transactions (Admin All Transactions Audit)');

    const adminLoans = await req('GET', '/admin/loans', null, adminToken);
    test(adminLoans.status === 200 && Array.isArray(adminLoans.data?.data?.loans), 'GET /api/admin/loans (Admin Loans List)');

    const adminFraud = await req('GET', '/admin/fraud-alerts', null, adminToken);
    const fraudList = adminFraud.data?.alerts || adminFraud.data?.data;
    test(adminFraud.status === 200 && Array.isArray(fraudList), 'GET /api/admin/fraud-alerts (Admin Fraud Alerts)');

    const adminAudit = await req('GET', '/admin/audit-logs', null, adminToken);
    test(adminAudit.status === 200 && Array.isArray(adminAudit.data?.data), 'GET /api/admin/audit-logs (Admin Audit Logs)');

    // 11. Logout
    console.log('\n--- 11. Session Termination ---');
    const logoutRes = await req('POST', '/auth/logout');
    test(logoutRes.status === 200, 'POST /api/auth/logout (Logout)');

  } catch (err) {
    console.error('Fatal testing error:', err);
  }

  console.log('\n================================================================');
  console.log(`  AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) {
    console.log('\nIssues to resolve:');
    issues.forEach((iss, i) => console.log(`  ${i + 1}. [${iss.name}] -> ${iss.details}`));
  } else {
    console.log('\n  >>> ALL ENDPOINT APIS AND FUNCTIONALITY ARE 100% OPERATIONAL! <<<');
  }
}

runAudit();
