import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  const bgColor = useMemo(() => {
    const colors = [
      'bg-indigo-500 text-white shadow-indigo-200',
      'bg-emerald-500 text-white shadow-emerald-200',
      'bg-rose-500 text-white shadow-rose-200',
      'bg-amber-500 text-white shadow-amber-200',
      'bg-sky-500 text-white shadow-sky-200',
      'bg-violet-500 text-white shadow-violet-200',
      'bg-orange-500 text-white shadow-orange-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 border-white shadow-md',
        sizes[size],
        !src && bgColor,
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
