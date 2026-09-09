const Account = require('../models/Account');

/**
 * Centralized Institutional Account Balance Service
 * Gated internal service for safely mutating account balances.
 * Direct balance modification via arbitrary API payloads is strictly prohibited.
 */

/**
 * Credit funds to a customer account
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} [params.accountId]
 * @param {string} [params.accountNumber]
 * @param {number} params.amount
 * @param {ClientSession} [params.session]
 * @returns {Promise<{account: Object, previousBalance: number, newBalance: number}>}
 */
const creditAccount = async ({ accountId, accountNumber, amount, session = null }) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Credit amount must be a positive number greater than 0.');
    error.statusCode = 400;
    throw error;
  }

  const query = accountId ? { _id: accountId } : { accountNumber };
  const queryOptions = session ? { session } : {};
  const account = await Account.findOne(query, null, queryOptions);

  if (!account) {
    const error = new Error('Target bank account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (account.status.toLowerCase() !== 'active') {
    const error = new Error(
      `Account is ${account.status.toLowerCase()}. Deposits and credits are not permitted.`
    );
    error.statusCode = 403;
    throw error;
  }

  const previousBalance = account.balance;
  const newBalance = parseFloat((previousBalance + numericAmount).toFixed(2));

  account.balance = newBalance;
  await account.save(queryOptions);

  return {
    account,
    previousBalance,
    newBalance,
  };
};

/**
 * Debit funds from a customer account
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} [params.accountId]
 * @param {string} [params.accountNumber]
 * @param {number} params.amount
 * @param {ClientSession} [params.session]
 * @returns {Promise<{account: Object, previousBalance: number, newBalance: number}>}
 */
const debitAccount = async ({ accountId, accountNumber, amount, session = null }) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Debit amount must be a positive number greater than 0.');
    error.statusCode = 400;
    throw error;
  }

  const query = accountId ? { _id: accountId } : { accountNumber };
  const queryOptions = session ? { session } : {};
  const account = await Account.findOne(query, null, queryOptions);

  if (!account) {
    const error = new Error('Target bank account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (account.status.toLowerCase() !== 'active') {
    const error = new Error(
      `Account is ${account.status.toLowerCase()}. Withdrawals and debits are not permitted.`
    );
    error.statusCode = 403;
    throw error;
  }

  if (account.balance < numericAmount) {
    const formattedBal = account.balance.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    });
    const formattedReq = numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    });
    const error = new Error(
      `Insufficient balance. Available funds: ₹${formattedBal}, Requested: ₹${formattedReq}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const previousBalance = account.balance;
  const newBalance = parseFloat((previousBalance - numericAmount).toFixed(2));

  account.balance = newBalance;
  await account.save(queryOptions);

  return {
    account,
    previousBalance,
    newBalance,
  };
};

module.exports = {
  creditAccount,
  debitAccount,
};
