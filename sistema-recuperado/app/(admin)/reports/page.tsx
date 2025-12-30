'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import FilterPanel, { FilterValues } from '@/components/admin/FilterPanel';
import LogsTable, { LogEntry } from '@/components/admin/LogsTable';
import ExportButton from '@/components/admin/ExportButton';
import { exportLogsToCSV, ExportableLog } from '@/lib/export';

const DEFAULT_PAGE_SIZE = 10;

// Stats Card Component
function StatsCard({
    title,
    value,
    icon: Icon,
    color = 'default',
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: 'default' | 'success' | 'error' | 'info';
}) {
    const colorClasses = {
        default: 'bg-white/5 border-white/10 text-[var(--text-primary)]',
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    };

    const iconColorClasses = {
        default: 'text-[var(--text-secondary)]',
        success: 'text-emerald-400',
        error: 'text-red-400',
        info: 'text-blue-400',
    };

    return (
        <div
            className={cn(
                'p-4 rounded-xl border transition-all duration-200',
                colorClasses[color]
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    {title}
                </span>
                <Icon size={18} className={iconColorClasses[color]} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

export default function ReportsPage() {
    // Data state
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

    // Filter state
    const [filters, setFilters] = useState<FilterValues>({
        search: '',
        startDate: '',
        endDate: '',
        userId: '',
        actionType: '',
    });

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        filtered: 0,
        errors: 0,
    });

    // Fetch users for the dropdown
    const fetchUsers = useCallback(async () => {
        try {
            const { data, error: usersError } = await supabase
                .from('profiles' as any)
                .select('id, full_name, email')
                .order('full_name');

            if (usersError) throw usersError;

            setUsers(
                (data || []).map((u: any) => ({
                    id: u.id,
                    name: u.full_name || 'Sem nome',
                    email: u.email || '',
                }))
            );
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
        }
    }, []);

    // Fetch logs
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('access_logs' as any)
                .select('*, profiles(full_name, email, avatar_url)', { count: 'exact' });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('created_at', `${filters.startDate}T00:00:00`);
            }
            if (filters.endDate) {
                query = query.lte('created_at', `${filters.endDate}T23:59:59`);
            }
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters.actionType) {
                query = query.ilike('action', `%${filters.actionType}%`);
            }
            if (filters.search) {
                // Search in action or via profiles join
                query = query.or(`action.ilike.%${filters.search}%`);
            }

            // Pagination
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            setLogs((data || []) as unknown as LogEntry[]);
            setTotalCount(count || 0);
            setStats((prev) => ({ ...prev, filtered: count || 0 }));
        } catch (err: any) {
            console.error('Erro ao buscar logs:', err);
            setError(err.message || 'Erro ao carregar logs');
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, itemsPerPage]);

    // Fetch total stats
    const fetchStats = useCallback(async () => {
        try {
            // Total count
            const { count: totalCount } = await supabase
                .from('access_logs' as any)
                .select('*', { count: 'exact', head: true });

            // Error count
            const { count: errorCount } = await supabase
                .from('access_logs' as any)
                .select('*', { count: 'exact', head: true })
                .or('action.ilike.%erro%,action.ilike.%error%,action.ilike.%negado%,action.ilike.%denied%');

            setStats({
                total: totalCount || 0,
                filtered: totalCount || 0,
                errors: errorCount || 0,
            });
        } catch (err) {
            console.error('Erro ao buscar estatísticas:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [fetchUsers, fetchStats]);

    // Fetch logs when filters or pagination change
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Handle filter submit
    const handleFilterSubmit = () => {
        setCurrentPage(1);
        fetchLogs();
    };

    // Handle filter clear
    const handleFilterClear = () => {
        setFilters({
            search: '',
            startDate: '',
            endDate: '',
            userId: '',
            actionType: '',
        });
        setCurrentPage(1);
    };

    // Handle export
    const handleExport = async () => {
        // Fetch all logs with current filters (no pagination)
        let query = supabase
            .from('access_logs' as any)
            .select('*, profiles(full_name, email)');

        if (filters.startDate) {
            query = query.gte('created_at', `${filters.startDate}T00:00:00`);
        }
        if (filters.endDate) {
            query = query.lte('created_at', `${filters.endDate}T23:59:59`);
        }
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.actionType) {
            query = query.ilike('action', `%${filters.actionType}%`);
        }

        query = query.order('created_at', { ascending: false }).limit(5000);

        const { data, error: exportError } = await query;

        if (exportError) {
            throw new Error('Erro ao exportar dados');
        }

        // Transform to exportable format
        const exportData: ExportableLog[] = (data || []).map((log: any) => ({
            id: log.id,
            created_at: log.created_at,
            user_id: log.user_id,
            action: log.action,
            details: log.details,
            user_name: log.profiles?.full_name || 'Desconhecido',
            user_email: log.profiles?.email || 'N/A',
        }));

        exportLogsToCSV(exportData);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const errorRate = stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Relatórios de Acesso
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Monitore e audite todas as atividades do sistema
                    </p>
                </div>
                <ExportButton onExport={handleExport} disabled={isLoading || logs.length === 0} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                    title="Total de Registros"
                    value={stats.total.toLocaleString('pt-BR')}
                    icon={FileText}
                    color="default"
                />
                <StatsCard
                    title="Registros Filtrados"
                    value={stats.filtered.toLocaleString('pt-BR')}
                    icon={TrendingUp}
                    color="info"
                />
                <StatsCard
                    title="Taxa de Erros"
                    value={`${errorRate}%`}
                    icon={AlertTriangle}
                    color={Number(errorRate) > 5 ? 'error' : 'success'}
                />
            </div>

            {/* Filter Panel */}
            <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onSubmit={handleFilterSubmit}
                onClear={handleFilterClear}
                users={users}
                isLoading={isLoading}
            />

            {/* Logs Table */}
            <LogsTable
                logs={logs}
                isLoading={isLoading}
                error={error}
                onRetry={fetchLogs}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
        </div>
    );
}
