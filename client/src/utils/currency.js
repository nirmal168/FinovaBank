/**
 * Centralized Currency Formatting Utility for Finova
 * Currency: Indian Rupee (INR / ₹)
 * Locale: en-IN (Indian numbering system: e.g., ₹1,00,000.00, ₹10,00,000.00)
 */

export const CURRENCY_CONFIG = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
};

/**
 * Formats a numeric value into full Indian Rupee currency representation.
 * @param {number|string} amount
 * @param {Object} options Intl.NumberFormat options override
 * @returns {string} e.g. "₹1,25,450.00"
 */
export const formatCurrency = (amount, options = {}) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0.00';

  const defaultOptions = {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  try {
    return new Intl.NumberFormat('en-IN', defaultOptions).format(num);
  } catch {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Formats a numeric value using Indian numbering convention without the currency symbol.
 * @param {number|string} amount
 * @param {Object} options
 * @returns {string} e.g. "1,25,450.00"
 */
export const formatAmount = (amount, options = {}) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '0.00';

  const defaultOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  try {
    return new Intl.NumberFormat('en-IN', defaultOptions).format(num);
  } catch {
    return num.toLocaleString('en-IN', defaultOptions);
  }
};

/**
 * Compact Indian numbering formatter for charts and condensed badges.
 * @param {number|string} amount
 * @returns {string} e.g. "₹10K", "₹1L", "₹5L", "₹1Cr"
 */
export const formatCompactINR = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    const val = (abs / 10000000).toFixed(abs % 10000000 === 0 ? 0 : 1);
    return `${sign}₹${val}Cr`;
  }
  if (abs >= 100000) {
    const val = (abs / 100000).toFixed(abs % 100000 === 0 ? 0 : 1);
    return `${sign}₹${val}L`;
  }
  if (abs >= 1000) {
    const val = (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1);
    return `${sign}₹${val}K`;
  }
  return `${sign}₹${abs}`;
};

export default {
  CURRENCY_CONFIG,
  formatCurrency,
  formatAmount,
  formatCompactINR,
};
