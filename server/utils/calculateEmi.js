/**
 * Default Benchmark Interest Rates by Loan Type
 */
const DEFAULT_INTEREST_RATES = {
  Personal: 11.5,
  Education: 8.5,
  Home: 7.5,
  Vehicle: 9.0,
};

/**
 * Calculates monthly EMI and total repayment values
 *
 * Formula:
 *   E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * @param {number} principal - Loan amount (P)
 * @param {number} annualRate - Annual interest rate in percentage (e.g. 10.5 for 10.5%)
 * @param {number} tenureMonths - Duration in months (n)
 * @returns {object} { emi, totalPayable, totalInterest, monthlyRate }
 */
function calculateEmi(principal, annualRate, tenureMonths) {
  const P = parseFloat(principal);
  const R = parseFloat(annualRate);
  const n = parseInt(tenureMonths, 10);

  if (isNaN(P) || P <= 0 || isNaN(R) || R < 0 || isNaN(n) || n <= 0) {
    throw new Error('Invalid loan parameters for EMI calculation.');
  }

  // Monthly interest rate
  const monthlyRate = R / (12 * 100);

  let emi;
  if (monthlyRate === 0) {
    emi = P / n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    emi = (P * monthlyRate * factor) / (factor - 1);
  }

  const roundedEmi = Math.round(emi * 100) / 100;
  const totalPayable = Math.round(roundedEmi * n * 100) / 100;
  const totalInterest = Math.round((totalPayable - P) * 100) / 100;

  return {
    emi: roundedEmi,
    totalPayable,
    totalInterest,
    monthlyRate,
  };
}

module.exports = {
  calculateEmi,
  DEFAULT_INTEREST_RATES,
};
