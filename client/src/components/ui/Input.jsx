import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      name,
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--finova-text-heading)] tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-xl">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--finova-text-secondary)]">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}

          <input
            id={inputId}
            name={name}
            type={type}
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-xl border bg-[var(--finova-input-bg)] px-4 py-2.5 text-sm text-[var(--finova-text-main)] transition-colors placeholder:text-[var(--finova-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-blue)]/20 disabled:bg-[var(--finova-bg-secondary)] disabled:text-[var(--finova-text-muted)] disabled:cursor-not-allowed ${
              LeftIcon ? 'pl-10' : ''
            } ${RightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-[var(--finova-danger)] focus:border-[var(--finova-danger)] focus:ring-[var(--finova-danger)]/20'
                : 'border-[var(--finova-border)] focus:border-[var(--finova-primary)]'
            } ${className}`}
            {...props}
          />

          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--finova-text-secondary)]">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[var(--finova-danger)] font-medium flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--finova-text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
