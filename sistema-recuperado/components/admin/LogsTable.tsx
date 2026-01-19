'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import ActionBadge from './ActionBadge';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import Pagination from './Pagination';

export interface LogEntry {
    id: string;
    created_at: string;
    user_id: string | null;
    action: string;
    details: Record<string, unknown> | null;
    profiles?: {
        full_name: string | null;
        email?: string;
        avatar_url?: string | null;
    } | null;
}

interface LogsTableProps {
    logs: LogEntry[];
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    // Pagination props
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    className?: string;
}

// Format date to DD/MM/YYYY HH:MM
function formatDateTime(dateString: string): { date: string; time: string } {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return {
            date: `${day}/${month}/${year}`,
            time: `${hours}:${minutes}`,
        };
    } catch {
        return { date: dateString, time: '' };
    }
}

// Get initials from name or email
function getInitials(name: string | null | undefined, email?: string): string {
    if (name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return '??';
}

// Expandable row for details
function ExpandableDetails({ details }: { details: Record<string, unknown> | null }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!details || Object.keys(details).length === 0) {
        return <span className="text-[var(--text-secondary)] text-xs italic">Sem detalhes</span>;
    }

    const jsonString = JSON.stringify(details, null, 2);
    const preview = JSON.stringify(details).substring(0, 50);

    return (
        <div className="max-w-xs">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    'flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                    'transition-colors duration-200'
                )}
            >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span className="font-mono truncate">{preview}...</span>
            </button>

            {isExpanded && (
                <pre
                    className={cn(
                        'mt-2 p-3 rounded-lg text-xs font-mono overflow-auto max-h-48',
                        'bg-black/20 border border-white/5 text-[var(--text-secondary)]'
                    )}
                >
                    {jsonString}
                </pre>
            )}
        </div>
    );
}

export function LogsTable({
    logs,
    isLoading,
    error,
    onRetry,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    className,
}: LogsTableProps) {
    // Loading state
    if (isLoading) {
        return <LoadingState rows={itemsPerPage} columns={5} className={className} />;
    }

    // Error state
    if (error) {
        return <ErrorState title="Erro ao carregar logs" description={error} onRetry={onRetry} className={className} />;
    }

    // Empty state
    if (logs.length === 0) {
        return (
            <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-surface)]', className)}>
                <EmptyState />
            </div>
        );
    }

    const headerClass = cn(
        'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider',
        'text-[var(--text-secondary)]'
    );

    const cellClass = 'px-6 py-4';

    return (
        <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-surface)]', className)}>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className={headerClass}>Data/Hora</th>
                            <th className={headerClass}>Usuário</th>
                            <th className={headerClass}>Email</th>
                            <th className={headerClass}>Ação</th>
                            <th className={headerClass}>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map((log) => {
                            const { date, time } = formatDateTime(log.created_at);
                            const userName = log.profiles?.full_name || 'Usuário Desconhecido';
                            const userEmail = log.profiles?.email || log.user_id || 'N/A';
                            const initials = getInitials(log.profiles?.full_name, log.profiles?.email);

                            return (
                                <tr
                                    key={log.id}
                                    className="hover:bg-white/[0.02] transition-colors duration-150"
                                >
                                    {/* Date/Time */}
                                    <td className={cn(cellClass, 'whitespace-nowrap')}>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">{date}</div>
                                        <div className="text-xs text-[var(--text-secondary)] font-mono">{time}</div>
                                    </td>

                                    {/* User */}
                                    <td className={cellClass}>
                                        <div className="flex items-center gap-3">
                                            {log.profiles?.avatar_url ? (
                                                <img
                                                    src={log.profiles.avatar_url}
                                                    alt={userName}
                                                    className="w-8 h-8 rounded-full object-cover bg-white/10"
                                                />
                                            ) : (
                                                <div
                                                    className={cn(
                                                        'w-8 h-8 rounded-full flex items-center justify-center',
                                                        'bg-[var(--primary-main)]/20 text-[var(--primary-main)]',
                                                        'text-xs font-bold'
                                                    )}
                                                >
                                                    {initials}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[150px]">
                                                {userName}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className={cellClass}>
                                        <span className="text-sm text-[var(--text-secondary)] font-mono">{userEmail}</span>
                                    </td>

                                    {/* Action */}
                                    <td className={cellClass}>
                                        <ActionBadge action={log.action} />
                                    </td>

                                    {/* Details */}
                                    <td className={cellClass}>
                                        <ExpandableDetails details={log.details} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
            />
        </div>
    );
}

export default LogsTable;
