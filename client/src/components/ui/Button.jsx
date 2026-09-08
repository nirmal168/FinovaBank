import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-[var(--finova-deep)] text-white hover:opacity-90 focus:ring-[var(--finova-blue)] shadow-xs',
    secondary:
      'bg-[var(--finova-card-bg)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] focus:ring-[var(--finova-blue)]',
    outline:
      'bg-transparent border border-[var(--finova-border)] text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] focus:ring-[var(--finova-blue)]',
    danger:
      'bg-[var(--finova-danger)] text-white hover:opacity-90 focus:ring-[var(--finova-danger)]/50 shadow-xs',
    ghost:
      'bg-transparent text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)] focus:ring-[var(--finova-blue)]',
    success:
      'bg-[var(--finova-success)] text-white hover:opacity-90 focus:ring-[var(--finova-success)]/50 shadow-xs',
    soft:
      'bg-[var(--finova-mint)] text-[var(--finova-text-heading)] hover:opacity-90 focus:ring-[var(--finova-sage)]',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
