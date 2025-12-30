'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Download, Check } from 'lucide-react';
import { LoadingSpinner } from './LoadingState';

interface ExportButtonProps {
    onExport: () => Promise<void>;
    disabled?: boolean;
    className?: string;
}

export function ExportButton({ onExport, disabled, className }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleExport = async () => {
        if (isExporting || disabled) return;

        setIsExporting(true);
        try {
            await onExport();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Erro ao exportar:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting || disabled}
            className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                showSuccess
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-[var(--primary-main)] text-white hover:bg-[var(--primary-hover)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            {isExporting ? (
                <>
                    <LoadingSpinner size={16} />
                    <span>Exportando...</span>
                </>
            ) : showSuccess ? (
                <>
                    <Check size={16} />
                    <span>Exportado!</span>
                </>
            ) : (
                <>
                    <Download size={16} />
                    <span>Exportar CSV</span>
                </>
            )}
        </button>
    );
}

export default ExportButton;
