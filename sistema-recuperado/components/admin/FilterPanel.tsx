'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Filter, X, User, Activity } from 'lucide-react';
import DateRangeFilter from './DateRangeFilter';

// Action types for the filter dropdown
const ACTION_TYPES = [
    { value: '', label: 'Todas as ações' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'view', label: 'Visualização' },
    { value: 'create', label: 'Criação' },
    { value: 'update', label: 'Atualização' },
    { value: 'delete', label: 'Exclusão' },
    { value: 'error', label: 'Erro' },
    { value: 'access_denied', label: 'Acesso Negado' },
];

export interface FilterValues {
    search: string;
    startDate: string;
    endDate: string;
    userId: string;
    actionType: string;
}

interface FilterPanelProps {
    filters: FilterValues;
    onFiltersChange: (filters: FilterValues) => void;
    onSubmit: () => void;
    onClear: () => void;
    users?: { id: string; name: string; email: string }[];
    isLoading?: boolean;
    className?: string;
}

export function FilterPanel({
    filters,
    onFiltersChange,
    onSubmit,
    onClear,
    users = [],
    isLoading,
    className,
}: FilterPanelProps) {
    const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const hasActiveFilters =
        filters.search || filters.startDate || filters.endDate || filters.userId || filters.actionType;

    const inputClass = cn(
        'w-full pl-10 pr-3 py-2.5 rounded-lg text-sm',
        'bg-[var(--bg-surface)] border border-white/10 text-[var(--text-primary)]',
        'placeholder:text-[var(--text-secondary)]/50',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary-main)]/50 focus:border-[var(--primary-main)]',
        'transition-all duration-200'
    );

    const selectClass = cn(
        'w-full pl-10 pr-3 py-2.5 rounded-lg text-sm appearance-none cursor-pointer',
        'bg-[var(--bg-surface)] border border-white/10 text-[var(--text-primary)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary-main)]/50 focus:border-[var(--primary-main)]',
        'transition-all duration-200'
    );

    const labelClass = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <div
            className={cn(
                'p-4 rounded-xl border border-white/10 bg-[var(--bg-surface)]',
                className
            )}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search Input */}
                <div className="lg:col-span-2">
                    <label className={labelClass}>Busca Geral</label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou ação..."
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* User Select */}
                <div>
                    <label className={labelClass}>Usuário</label>
                    <div className="relative">
                        <User
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                            size={16}
                        />
                        <select
                            value={filters.userId}
                            onChange={(e) => updateFilter('userId', e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Todos os usuários</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name || user.email}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action Type Select */}
                <div>
                    <label className={labelClass}>Tipo de Ação</label>
                    <div className="relative">
                        <Activity
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                            size={16}
                        />
                        <select
                            value={filters.actionType}
                            onChange={(e) => updateFilter('actionType', e.target.value)}
                            className={selectClass}
                        >
                            {ACTION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Date Range and Actions Row */}
            <div className="flex flex-col lg:flex-row items-end gap-4">
                {/* Date Range Filter */}
                <div className="flex-1 w-full">
                    <DateRangeFilter
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onStartDateChange={(date) => updateFilter('startDate', date)}
                        onEndDateChange={(date) => updateFilter('endDate', date)}
                        onClear={() => {
                            onFiltersChange({ ...filters, startDate: '', endDate: '' });
                        }}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={onClear}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
                                'bg-white/5 border border-white/10 text-[var(--text-secondary)]',
                                'hover:bg-white/10 hover:text-[var(--text-primary)]',
                                'transition-all duration-200'
                            )}
                        >
                            <X size={16} />
                            <span className="hidden sm:inline">Limpar</span>
                        </button>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={onSubmit}
                        disabled={isLoading}
                        className={cn(
                            'flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium',
                            'bg-[var(--primary-main)] text-white',
                            'hover:bg-[var(--primary-hover)]',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-all duration-200'
                        )}
                    >
                        <Filter size={16} />
                        <span>Filtrar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterPanel;
