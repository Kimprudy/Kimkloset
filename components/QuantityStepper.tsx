'use client';

import { Minus, Plus } from 'lucide-react';
import { MAX_QTY } from '@/lib/config';

export default function QuantityStepper({
  value,
  onChange,
  disabled,
  size = 'md',
  max = MAX_QTY,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  max?: number;
}) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  return (
    <div className="inline-flex items-center rounded-full border border-ink/15 bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled}
        className={`${box} flex items-center justify-center rounded-full hover:bg-brand-50 disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= Math.min(MAX_QTY, max)}
        className={`${box} flex items-center justify-center rounded-full hover:bg-brand-50 disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
