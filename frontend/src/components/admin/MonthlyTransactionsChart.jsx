import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import { formatCurrency } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] p-3 rounded-lg shadow-xl text-xs">
        <p className="text-[var(--finova-text-heading)] font-semibold mb-1">{label}</p>
        <p className="text-brand-500 font-medium">
          Transactions: <span className="text-[var(--finova-text-heading)] font-bold">{payload[0].value}</span>
        </p>
        {payload[0].payload.amount !== undefined && (
          <p className="text-[var(--finova-text-secondary)] mt-1">
            Total Vol: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(payload[0].payload.amount)}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const MonthlyTransactionsChart = ({ data = [] }) => {
  return (
    <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">Monthly Transaction Trend</h3>
        <p className="text-xs text-[var(--finova-text-secondary)]">Total transaction frequency over the past 6 months</p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F7CAC" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4F7CAC" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--finova-chart-grid)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4F7CAC"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyTransactionsChart;
