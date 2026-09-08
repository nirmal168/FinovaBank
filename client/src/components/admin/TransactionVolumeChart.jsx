import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import { formatCurrency, formatCompactINR } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] p-3 rounded-lg shadow-xl text-xs">
        <p className="text-[var(--finova-text-heading)] font-semibold capitalize mb-1">{label} Transactions</p>
        <p className="text-brand-500 font-medium">
          Count: <span className="text-[var(--finova-text-heading)] font-bold">{payload[0].payload.count}</span>
        </p>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
          Volume: <span className="text-[var(--finova-text-heading)] font-bold">{formatCurrency(payload[0].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const TransactionVolumeChart = ({ data = [] }) => {
  return (
    <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">Transaction Volume by Type</h3>
        <p className="text-xs text-[var(--finova-text-secondary)]">Total volume processed across transaction types</p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--finova-chart-grid)" horizontal={false} />
            <XAxis type="number" stroke="var(--finova-text-muted)" fontSize={11} tickLine={false} tickFormatter={formatCompactINR} />
            <YAxis
              type="category"
              dataKey="type"
              stroke="var(--finova-text-muted)"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => val.charAt(0) + val.slice(1).toLowerCase()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalAmount" name="Volume" fill="#4F7CAC" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TransactionVolumeChart;
