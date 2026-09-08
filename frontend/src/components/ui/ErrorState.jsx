import React from 'react';
import Button from './Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  title = 'Failed to load information',
  message = 'An error occurred while communicating with the banking server.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/40 rounded-2xl border border-rose-200/80 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-rose-900">{title}</h3>
      <p className="text-xs sm:text-sm text-rose-600 max-w-sm mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
          className="!border-rose-300 !text-rose-700 hover:!bg-rose-100/50"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
