import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'pink' | 'cyan';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'sm',
  className,
}) => {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    error: 'bg-red-500/10 text-red-600 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]',
    neutral: 'bg-slate-500/10 text-slate-600 border-slate-500/20 shadow-[0_0_8px_rgba(148,163,184,0.1)]',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)]',
    pink: 'bg-pink-500/10 text-pink-600 border-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.1)]',
    cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-full border transition-all duration-300',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full animate-pulse',
        dotColors[variant]
      )} />
      {children}
    </span>
  );
};
