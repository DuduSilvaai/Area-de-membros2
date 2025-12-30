'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, X } from 'lucide-react';

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onClear?: () => void;
    className?: string;
}

export function DateRangeFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onClear,
    className,
}: DateRangeFilterProps) {
    const hasValue = startDate || endDate;

    const inputClass = cn(
        'w-full pl-10 pr-3 py-2.5 rounded-lg text-sm',
        'bg-[var(--bg-surface)] border border-white/10 text-[var(--text-primary)]',
        'placeholder:text-[var(--text-secondary)]/50',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary-main)]/50 focus:border-[var(--primary-main)]',
        'transition-all duration-200'
    );

    const labelClass = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

    return (
        <div className={cn('flex flex-col sm:flex-row items-end gap-3', className)}>
            {/* Start Date */}
            <div className="flex-1 w-full sm:w-auto">
                <label className={labelClass}>Data Início</label>
                <div className="relative">
                    <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                        size={16}
                    />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:flex items-center justify-center h-10 text-[var(--text-secondary)]">
                <span className="text-xs">até</span>
            </div>

            {/* End Date */}
            <div className="flex-1 w-full sm:w-auto">
                <label className={labelClass}>Data Fim</label>
                <div className="relative">
                    <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                        size={16}
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Clear button */}
            {onClear && hasValue && (
                <button
                    onClick={onClear}
                    className={cn(
                        'h-10 w-10 flex items-center justify-center rounded-lg',
                        'bg-white/5 border border-white/10',
                        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                        'hover:bg-white/10 transition-all duration-200'
                    )}
                    title="Limpar datas"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

export default DateRangeFilter;
