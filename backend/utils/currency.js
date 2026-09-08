/**
 * Centralized Currency Configuration & Helper for Finova Backend
 * Currency: Indian Rupee (INR / ₹)
 * Locale: en-IN
 */

const CURRENCY_CONFIG = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
};

/**
 * Format monetary amount with Indian Rupee symbol and Indian numbering format
 * @param {number|string} amount
 * @returns {string} e.g. "₹25,000.00"
 */
const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

module.exports = {
  CURRENCY_CONFIG,
  formatCurrency,
};
