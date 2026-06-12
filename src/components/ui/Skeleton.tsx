import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  lines = 1,
}) => {
  const baseClass = 'bg-[var(--bg-elevated)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent';

  if (variant === 'text') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn(baseClass, 'h-4 rounded w-full', className)} />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={cn(baseClass, 'rounded-full', className)} />;
  }

  return <div className={cn(baseClass, 'rounded-xl', className)} />;
};
