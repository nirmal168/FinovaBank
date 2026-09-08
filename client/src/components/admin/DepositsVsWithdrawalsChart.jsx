import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { formatCurrency, formatCompactINR } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] p-3 rounded-lg shadow-xl text-xs space-y-1">
        <p className="text-[var(--finova-text-heading)] font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--finova-text-secondary)] capitalize">{entry.name}:</span>
            <span className="text-[var(--finova-text-heading)] font-bold">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DepositsVsWithdrawalsChart = ({ data = [] }) => {
  return (
    <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">Deposits vs Withdrawals</h3>
        <p className="text-xs text-[var(--finova-text-secondary)]">Cash inflow vs outflow comparisons over 6 months</p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--finova-chart-grid)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} tickFormatter={formatCompactINR} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(value) => <span className="text-[var(--finova-text-secondary)] capitalize">{value}</span>}
            />
            <Bar dataKey="deposits" name="Deposits" fill="#5B8C72" radius={[4, 4, 0, 0]} />
            <Bar dataKey="withdrawals" name="Withdrawals" fill="#B85C5C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepositsVsWithdrawalsChart;
