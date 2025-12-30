'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = 'Erro ao carregar dados',
    description = 'Ocorreu um problema ao buscar os dados. Por favor, tente novamente.',
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-16 px-8 text-center',
                className
            )}
        >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle size={28} className="text-red-400" />
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {title}
            </h3>

            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                {description}
            </p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                        'bg-[var(--primary-main)] text-white',
                        'hover:bg-[var(--primary-hover)] transition-colors duration-200'
                    )}
                >
                    <RefreshCw size={16} />
                    Tentar novamente
                </button>
            )}
        </div>
    );
}

export default ErrorState;
