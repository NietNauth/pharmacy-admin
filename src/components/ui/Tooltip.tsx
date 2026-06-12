import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-elevated)] border-l-transparent border-r-transparent border-b-transparent border-[6px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-elevated)] border-l-transparent border-r-transparent border-t-transparent border-[6px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--bg-elevated)] border-t-transparent border-b-transparent border-r-transparent border-[6px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-elevated)] border-t-transparent border-b-transparent border-l-transparent border-[6px]',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
          <div className={cn('absolute w-0 h-0', arrowClasses[position])} />
        </div>
      )}
    </div>
  );
};
