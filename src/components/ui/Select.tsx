import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  error,
  options,
  placeholder,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={cn(
          'w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] text-base transition-all duration-150 ease-out p-2 outline-none',
          'focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-muted)]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';
