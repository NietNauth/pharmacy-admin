import React from 'react';


export interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className="animate-[fadeSlideUp_0.3s_ease-out_forwards] opacity-0 translate-y-2 p-4 sm:p-5 w-full max-w-7xl mx-auto flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div>
        {children}
      </div>
      <style>{`
        @keyframes fadeSlideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
