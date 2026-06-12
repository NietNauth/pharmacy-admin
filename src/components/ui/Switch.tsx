import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div 
          className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
            checked ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
          }`}
        ></div>
        <div 
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        ></div>
      </div>
      {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
    </label>
  );
};
