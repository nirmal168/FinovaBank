import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

import { formatCurrency } from '../../utils/currency';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] p-3 rounded-lg shadow-xl text-xs">
        <p className="text-[var(--finova-text-heading)] font-semibold capitalize mb-1">{data.name} Loan</p>
        <p className="text-[var(--finova-text-secondary)]">Applications: <span className="font-bold text-brand-500">{data.value}</span></p>
        {data.payload.totalAmount !== undefined && (
          <p className="text-[var(--finova-text-muted)] mt-0.5">
            Total Amount: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(data.payload.totalAmount)}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const LoanStatisticsChart = ({ data = [] }) => {
  const hasData = data && data.length > 0 && data.some((d) => d.count > 0);

  return (
    <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">Loan Portfolio Distribution</h3>
        <p className="text-xs text-[var(--finova-text-secondary)]">Applications categorized by loan type</p>
      </div>
      <div className="w-full h-64 flex items-center justify-center">
        {!hasData ? (
          <p className="text-[var(--finova-text-muted)] text-xs italic">No loan application data available yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="loanType"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => <span className="text-[var(--finova-text-secondary)] capitalize">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LoanStatisticsChart;
