/**
 * SecureBank Default Administrator & Demo Accounts Seeding Script
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *   npm run seed:admin
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Account = require('../models/Account');

const seedAdmin = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/securebank';
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@securebank.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPhone = process.env.ADMIN_PHONE || '+18005550199';

  console.log('====================================================');
  console.log('🛡️  SecureBank: Demo & Administrator Seeding Tool');
  console.log('====================================================');
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Seed or Update Administrator
    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      adminUser.name = adminName;
      adminUser.password = adminPassword;
      adminUser.role = 'admin';
      adminUser.isActive = true;
      adminUser.isVerified = true;
      await adminUser.save();
      console.log(`✅ Administrator updated: ${adminEmail} (password: ${adminPassword})`);
    } else {
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log(`🎉 Administrator created: ${adminEmail} (password: ${adminPassword})`);
    }

    // 2. Seed or Update Demo Customer
    let customerUser = await User.findOne({ email: 'customer@securebank.com' });
    if (customerUser) {
      customerUser.name = 'Sarah Jenkins';
      customerUser.password = 'password123';
      customerUser.role = 'customer';
      customerUser.isActive = true;
      customerUser.isVerified = true;
      await customerUser.save();
      console.log('✅ Customer demo updated: customer@securebank.com (password: password123)');
    } else {
      customerUser = await User.create({
        name: 'Sarah Jenkins',
        email: 'customer@securebank.com',
        phone: '+15551234567',
        password: 'password123',
        role: 'customer',
        isVerified: true,
        isActive: true,
      });
      console.log('🎉 Customer demo created: customer@securebank.com (password: password123)');
    }

    // Ensure customer has a funded account
    const account = await Account.getOrCreateUserAccount(customerUser._id);
    if (!account.balance || account.balance < 5000) {
      account.balance = 5420.50;
      await account.save();
    }
    console.log(`✅ Customer demo account #${account.accountNumber} balance: $${account.balance.toFixed(2)}`);

    // 3. Seed or Update Finova Demo Customer & Admin
    const demoAccounts = [
      { name: 'Finova Admin', email: 'admin@finova.com', role: 'admin', pass: 'admin123', phone: '+18005550199' },
      { name: 'Sarah Jenkins', email: 'customer@finova.com', role: 'customer', pass: 'password123', phone: '+15551234567' },
    ];

    for (const d of demoAccounts) {
      let u = await User.findOne({ email: d.email });
      if (u) {
        u.name = d.name;
        u.password = d.pass;
        u.role = d.role;
        u.isActive = true;
        u.isVerified = true;
        await u.save();
      } else {
        u = await User.create({
          name: d.name,
          email: d.email,
          phone: d.phone,
          password: d.pass,
          role: d.role,
          isVerified: true,
          isActive: true,
        });
      }
      if (d.role === 'customer') {
        const acc = await Account.getOrCreateUserAccount(u._id);
        if (!acc.balance || acc.balance < 5000) {
          acc.balance = 5420.50;
          await acc.save();
        }
      }
      console.log(`✅ Finova demo configured: ${d.email} (${d.role})`);
    }

    console.log('----------------------------------------------------');
    console.log('Quick 1-Click Login Credentials:');
    console.log(`  Admin Demo:    admin@finova.com    / admin123`);
    console.log(`  Customer Demo: customer@finova.com / password123`);
    console.log('----------------------------------------------------');
    console.log('Login at: http://localhost:5173/login');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding accounts:', error.message);
    process.exit(1);
  }
};

seedAdmin();
