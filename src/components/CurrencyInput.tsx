import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  className = '',
  min = 0,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value === 0 ? '' : value.toString();
  });
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value === 0 ? '' : value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number on focus for easy editing without commas
    setDisplayValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Allow only digits, comma, or dot
    raw = raw.replace(/[^0-9.,]/g, '');

    // Replace multiple dots or commas with a single dot
    const standardized = raw.replace(',', '.');
    const parts = standardized.split('.');
    const cleanNumStr = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];

    setDisplayValue(cleanNumStr);

    if (cleanNumStr === '' || cleanNumStr === '.') {
      onChange(0);
      return;
    }

    const parsed = parseFloat(cleanNumStr);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) {
        onChange(min);
      } else if (max !== undefined && parsed > max) {
        onChange(max);
      } else {
        onChange(parsed);
      }
    } else {
      onChange(0);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-2xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <DollarSign className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          inputMode="decimal"
          id={id}
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-400"
        />
        {value > 0 && !isFocused && (
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400">MXN</span>
          </div>
        )}
      </div>
    </div>
  );
};
