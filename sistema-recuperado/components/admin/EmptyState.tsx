'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FileSearch, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon = FileSearch,
    title = 'Nenhum resultado encontrado',
    description = 'Tente ajustar os filtros ou realizar uma nova busca.',
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-16 px-8 text-center',
                className
            )}
        >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Icon size={28} className="text-[var(--text-secondary)]" />
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {title}
            </h3>

            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                {description}
            </p>

            {action && <div>{action}</div>}
        </div>
    );
}

export default EmptyState;
