import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  iconLeft,
  iconRight,
  children,
  disabled,
  ...props
}, ref) => {
  const isButtonLoading = loading || isLoading;
  const leftIcon = iconLeft || (icon && iconPosition === 'left' ? icon : null);
  const rightIcon = iconRight || (icon && iconPosition === 'right' ? icon : null);

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]',
    secondary: 'bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_0_1px_var(--accent-primary)20]',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-base px-4 py-2 gap-2',
    lg: 'text-lg px-6 py-3 gap-2.5',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isButtonLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isButtonLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isButtonLoading && leftIcon}
      {children}
      {!isButtonLoading && rightIcon}
    </button>
  );
});
Button.displayName = 'Button';
