import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl relative overflow-hidden',
        hover && 'transition-all duration-150 ease-out hover:border-[var(--accent-primary)] hover:shadow-[0_0_0_1px_var(--accent-primary)20]',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
};
