import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base transition-all duration-150 ease-out p-2 outline-none',
            'focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-muted)]',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
      </div>
      {(error || hint) && (
        <span className={cn('text-sm', error ? 'text-red-500' : 'text-[var(--text-secondary)]')}>
          {error || hint}
        </span>
      )}
    </div>
  );
});
Input.displayName = 'Input';
