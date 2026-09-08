import api from './api';

export const DEFAULT_LOAN_RATES = {
  Personal: 11.5,
  Education: 8.5,
  Home: 7.5,
  Vehicle: 9.0,
};

export const LOAN_TYPES_CONFIG = [
  {
    type: 'Personal',
    name: 'Personal Loan',
    rate: 11.5,
    minAmount: 1000,
    maxAmount: 50000,
    minTenure: 6,
    maxTenure: 60,
    icon: 'User',
    description: 'Instant multi-purpose personal credit with flexible terms',
    accent: 'from-blue-600 to-indigo-700',
  },
  {
    type: 'Education',
    name: 'Education Loan',
    rate: 8.5,
    minAmount: 5000,
    maxAmount: 100000,
    minTenure: 12,
    maxTenure: 120,
    icon: 'GraduationCap',
    description: 'Low-interest funding for university tuition & living costs',
    accent: 'from-emerald-600 to-teal-700',
  },
  {
    type: 'Home',
    name: 'Home Loan / Mortgage',
    rate: 7.5,
    minAmount: 25000,
    maxAmount: 750000,
    minTenure: 24,
    maxTenure: 360,
    icon: 'Home',
    description: 'Competitive mortgage financing for residential properties',
    accent: 'from-purple-600 to-violet-800',
  },
  {
    type: 'Vehicle',
    name: 'Vehicle / Auto Loan',
    rate: 9.0,
    minAmount: 3000,
    maxAmount: 80000,
    minTenure: 12,
    maxTenure: 84,
    icon: 'Car',
    description: 'Fast auto financing for new and certified pre-owned vehicles',
    accent: 'from-amber-600 to-orange-700',
  },
];

/**
 * Standard EMI calculation helper
 */
export function calculateEmi(principal, annualRate, tenureMonths) {
  const P = parseFloat(principal) || 0;
  const R = parseFloat(annualRate) || 0;
  const n = parseInt(tenureMonths, 10) || 0;

  if (P <= 0 || n <= 0) {
    return { emi: 0, totalPayable: 0, totalInterest: 0 };
  }

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
  };
}

const loanService = {
  /**
   * Get all loans for current user
   */
  getLoans: async (params = {}) => {
    const res = await api.get('/loans', { params });
    return res.data;
  },

  /**
   * Get single loan details by ID
   */
  getLoanById: async (id) => {
    const res = await api.get(`/loans/${id}`);
    return res.data;
  },

  /**
   * Apply for a new loan
   */
  applyLoan: async (loanData) => {
    const res = await api.post('/loans', loanData);
    return res.data;
  },
};

export default loanService;
