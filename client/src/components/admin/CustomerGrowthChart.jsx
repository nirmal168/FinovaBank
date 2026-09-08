import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] p-3 rounded-lg shadow-xl text-xs">
        <p className="text-[var(--finova-text-heading)] font-semibold mb-1">{label}</p>
        <p className="text-brand-500 font-medium">
          New Registrations: <span className="text-[var(--finova-text-heading)] font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomerGrowthChart = ({ data = [] }) => {
  return (
    <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">Customer Growth</h3>
        <p className="text-xs text-[var(--finova-text-secondary)]">Monthly new customer registrations</p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--finova-chart-grid)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--finova-text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="newCustomers"
              stroke="#5B8C72"
              strokeWidth={3}
              dot={{ r: 4, fill: '#5B8C72', stroke: 'var(--finova-card-bg)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#7FA68C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerGrowthChart;
