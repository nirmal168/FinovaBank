const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Account = require('../models/Account');

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securebank';
    console.log('[Currency Migration] Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('[Currency Migration] Scanning Accounts collection for non-INR records...');
    const result = await Account.updateMany(
      { currency: { $ne: 'INR' } },
      { $set: { currency: 'INR' } }
    );

    console.log(`[Currency Migration] Successfully updated ${result.modifiedCount} accounts to currency: 'INR'.`);
    console.log('[Currency Migration] Numeric balances preserved strictly intact.');

    await mongoose.disconnect();
    console.log('[Currency Migration] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Currency Migration Error]:', err.message);
    process.exit(1);
  }
}

migrate();
