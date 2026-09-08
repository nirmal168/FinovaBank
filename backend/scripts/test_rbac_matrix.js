const API_BASE = 'http://localhost:5000/api';

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method: method.toUpperCase(),
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('  FINOVA BANK — STRICT RBAC VERIFICATION SUITE');
  console.log('====================================================\n');

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

  try {
    // 1. PUBLIC REGISTRATION IS STRICTLY FORBIDDEN (403)
    console.log('--- TEST GROUP 1: Public Registration Lockdown ---');
    const regRes = await req('POST', '/auth/register', {
      name: 'Hacker Self Reg',
      email: 'hacker@test.com',
      password: 'Password@123',
      phone: '9999999999'
    });
    assert(
      regRes.status === 403,
      `POST /api/auth/register returned 403 Forbidden (${regRes.data?.message})`
    );

    // 2. ADMIN AUTHENTICATION
    console.log('\n--- TEST GROUP 2: Admin Authentication & Access ---');
    const adminLoginRes = await req('POST', '/auth/login', {
      identifier: 'admin@finova.com',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data?.token;
    const adminUser = adminLoginRes.data?.user;
    assert(
      adminLoginRes.status === 200 && adminUser?.role === 'admin',
      `Admin logged in successfully with role="admin"`
    );

    // 3. ADMIN ACCESSES ADMIN ENDPOINTS
    const dashRes = await req('GET', '/admin/dashboard', null, adminToken);
    assert(dashRes.status === 200 && dashRes.data?.success, 'Admin GET /api/admin/dashboard returned 200 OK');

    // 4. ADMIN CREATES CUSTOMER (WITH AUTO-GENERATED CUSTOMER ID & MUST CHANGE PASSWORD)
    console.log('\n--- TEST GROUP 3: Admin-Only Customer Provisioning ---');
    const testEmail = `testuser_${Date.now()}@finova.test`;
    const createRes = await req('POST', '/admin/customers', {
      name: 'Priya Sharma',
      email: testEmail,
      phone: '9876543210',
      initialDeposit: 15000,
      accountType: 'Savings',
      dateOfBirth: '1995-06-15',
      address: {
        street: '45 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    }, adminToken);

    assert(createRes.status === 201 && createRes.data?.success, `Admin created customer successfully (status: ${createRes.status}, data: ${JSON.stringify(createRes.data)})`);
    const newCustomer = createRes.data?.customer || {};
    assert(
      newCustomer.customerId && newCustomer.customerId.startsWith('FIN-CUS-'),
      `Customer ID auto-generated in format FIN-CUS-XXXXX: ${newCustomer.customerId}`
    );
    assert(
      newCustomer.mustChangePassword === true,
      `Customer created with mustChangePassword = true`
    );
    assert(
      newCustomer.role === 'customer',
      `Customer assigned role = "customer"`
    );
    const tempPassword = createRes.data?.temporaryPassword;
    assert(
      tempPassword && tempPassword.length >= 8,
      `Temporary password generated: ${tempPassword}`
    );
    const defaultAccount = createRes.data?.account;
    assert(
      defaultAccount && defaultAccount.balance === 15000,
      `Default bank account provisioned with INR 15,000 balance`
    );

    // 5. CUSTOMER LOGIN USING CUSTOMER ID & TEMPORARY PASSWORD
    console.log('\n--- TEST GROUP 4: Customer Login & Password Rotation ---');
    const custLoginRes = await req('POST', '/auth/login', {
      identifier: newCustomer.customerId,
      password: tempPassword
    });
    assert(custLoginRes.status === 200, `Customer logged in using Customer ID (${newCustomer.customerId})`);
    assert(
      custLoginRes.data?.user?.mustChangePassword === true,
      'Login response returned mustChangePassword === true'
    );
    const customerToken = custLoginRes.data?.token;

    // 6. STRICT CUSTOMER ACCESS RESTRICTION: CUSTOMER CANNOT ACCESS ADMIN ROUTES
    console.log('\n--- TEST GROUP 5: Customer Blocked from Admin Endpoints ---');
    const adminEndpoints = [
      { method: 'GET', path: '/admin/dashboard', desc: 'Admin Dashboard' },
      { method: 'GET', path: '/admin/customers', desc: 'Admin Customers List' },
      { method: 'GET', path: '/admin/transactions', desc: 'Admin Transactions Audit' },
      { method: 'PUT', path: `/admin/customers/${newCustomer.id}/status`, body: { status: 'Inactive' }, desc: 'Customer Status Change' },
    ];

    for (const ep of adminEndpoints) {
      const res = await req(ep.method, ep.path, ep.body, customerToken);
      assert(
        res.status === 403,
        `Customer accessing ${ep.desc} denied with 403 Forbidden`
      );
    }

    // 7. CROSS-CUSTOMER RESOURCE BOUNDARIES
    console.log('\n--- TEST GROUP 6: Cross-Customer Isolation & Resource Ownership ---');
    const cust1Login = await req('POST', '/auth/login', {
      identifier: 'customer@finova.com',
      password: 'password123'
    });
    const cust1Token = cust1Login.data?.token;

    if (cust1Token && defaultAccount) {
      const accRes = await req('GET', `/accounts/${defaultAccount._id}`, null, cust1Token);
      assert(
        accRes.status === 403 || accRes.status === 404,
        `Customer 1 blocked from accessing Customer 2 account (${accRes.status} ${accRes.data?.message || ''})`
      );

      const withdrawRes = await req('POST', '/transactions/withdraw', {
        accountId: defaultAccount._id,
        amount: 500,
        description: 'Hacked withdrawal'
      }, cust1Token);
      assert(
        withdrawRes.status === 403 || withdrawRes.status === 404,
        `Customer 1 blocked from withdrawing from Customer 2 account (${withdrawRes.status})`
      );
    }

    // 8. MANDATORY PASSWORD ROTATION VIA /api/auth/change-password
    console.log('\n--- TEST GROUP 7: Password Rotation Flow ---');
    const updatedPassword = 'MyNewSecurePassword#2026';
    const changeRes = await req('PUT', '/auth/change-password', {
      currentPassword: tempPassword,
      newPassword: updatedPassword
    }, customerToken);
    assert(changeRes.status === 200 && changeRes.data?.success, 'Password successfully rotated');

    const reloginRes = await req('POST', '/auth/login', {
      identifier: testEmail,
      password: updatedPassword
    });
    assert(
      reloginRes.status === 200 && reloginRes.data?.user?.mustChangePassword === false,
      'Customer logged in with new password; mustChangePassword is now FALSE'
    );

    // 9. ADMIN ACCOUNT LIFECYCLE & STATUS ENFORCEMENT (FREEZE/ACTIVE)
    console.log('\n--- TEST GROUP 8: Admin Customer Status Control (Freeze/Active) ---');
    const freezeRes = await req('PUT', `/admin/customers/${newCustomer.id}/status`, { status: 'Frozen' }, adminToken);
    assert(freezeRes.status === 200 && freezeRes.data?.customer?.status === 'Frozen', 'Admin set customer status to "Frozen"');

    const frozenLoginRes = await req('POST', '/auth/login', {
      identifier: testEmail,
      password: updatedPassword
    });
    assert(
      frozenLoginRes.status === 403,
      `Frozen customer login blocked with 403: "${frozenLoginRes.data?.message}"`
    );

    const unfreezeRes = await req('PUT', `/admin/customers/${newCustomer.id}/status`, { status: 'Active' }, adminToken);
    assert(unfreezeRes.status === 200 && unfreezeRes.data?.customer?.status === 'Active', 'Admin restored customer status to "Active"');

    const activeLoginRes = await req('POST', '/auth/login', {
      identifier: testEmail,
      password: updatedPassword
    });
    assert(activeLoginRes.status === 200, 'Reactivated customer successfully logged in');

    // 10. ADMIN PASSWORD RESET FOR CUSTOMER
    console.log('\n--- TEST GROUP 9: Admin Customer Password Reset ---');
    const resetRes = await req('POST', `/admin/customers/${newCustomer.id}/reset-password`, {}, adminToken);
    assert(
      resetRes.status === 200 && resetRes.data?.temporaryPassword,
      `Admin reset customer password; new temporary password issued: ${resetRes.data?.temporaryPassword}`
    );

    const checkCust = await req('GET', `/admin/customers/${newCustomer.id}`, null, adminToken);
    assert(
      checkCust.data?.customer?.mustChangePassword === true,
      'Customer mustChangePassword reset to true after admin password reset'
    );

  } catch (globalErr) {
    console.error('Fatal error running suite:', globalErr);
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed === 0) {
    console.log('  >>> ALL STRICT RBAC CRITERIA FULLY SATISFIED! <<<');
  }
}

runTests();
