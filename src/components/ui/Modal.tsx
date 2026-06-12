import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div
        className={cn(
          'w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl flex flex-col shadow-2xl relative z-10',
          'animate-in fade-in zoom-in-95 duration-200',
          'max-sm:fixed max-sm:bottom-0 max-sm:rounded-b-none max-sm:w-full max-sm:slide-in-from-bottom',
          'max-h-[90vh]',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--bg-border)] p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="border-t border-[var(--bg-border)] p-4 sm:p-5 bg-[var(--bg-surface)] rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
