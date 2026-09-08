import React from 'react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
      <table className={`w-full text-left text-sm text-[var(--finova-text-secondary)] ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-[var(--finova-bg-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--finova-text-muted)] border-b border-[var(--finova-border)] ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return <tbody className={`divide-y divide-[var(--finova-border)]/60 ${className}`}>{children}</tbody>;
};

export const TableRow = ({ children, className = '', hover = true }) => {
  return (
    <tr
      className={`transition-colors ${
        hover ? 'hover:bg-[var(--finova-bg-secondary)]/70' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '' }) => {
  return (
    <th scope="col" className={`px-5 py-3.5 ${className}`}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '' }) => {
  return <td className={`px-5 py-4 whitespace-nowrap text-sm text-[var(--finova-text-main)] ${className}`}>{children}</td>;
};

export const TableEmpty = ({ colSpan, message = 'No records found' }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-10 text-[var(--finova-text-muted)] text-sm">
        {message}
      </td>
    </tr>
  );
};

export default Table;
