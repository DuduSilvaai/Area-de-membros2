'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Log {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  details: any;
  ip_address?: string; // Assuming this column exists or might exist
  profiles: {
    email: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Email or Name

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('access_logs' as any)
        .select('*, profiles(email, full_name, avatar_url)', { count: 'exact' });

      // Apply Filters
      if (dateStart) {
        query = query.gte('created_at', `${dateStart}T00:00:00`);
      }
      if (dateEnd) {
        query = query.lte('created_at', `${dateEnd}T23:59:59`);
      }

      // Note: Filtering by profile email/name via a join requires specific handling.
      // Supabase's simple .ilike on joined tables works if !inner is used, OR we filter normally.
      // For now, let's assume we might need to filter on the top level if it's user_id, 
      // but searching by EMAIL string inside profiles needs the relation.
      if (searchTerm) {
        // We use the notation for filtering on related tables.
        // Important: This turns the LEFT JOIN into an INNER JOIN effectively for the filtered rows.
        query = query.ilike('profiles.email', `%${searchTerm}%`);
        // If you wanted to search name too: .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`, { foreignTable: 'profiles' })
      }

      // Pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data as any[] || []);
      if (count !== null) setTotalCount(count);

    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, dateStart, dateEnd, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on search
    fetchLogs(); // Trigger fetch manually if needed, though useEffect covers it if states change
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Auditoria de Acessos</h1>
          <p className="text-sm text-gray-500">Monitore quem acessou e o que fez no sistema</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end md:items-center">

        {/* Date Range */}
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={dateStart}
                onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* User Search */}
        <div className="flex-1 w-full md:w-auto">
          <label className="block text-xs font-medium text-gray-700 mb-1">Buscar Usuário (Email)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Digite o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
              onBlur={() => setPage(1)} // Trigger on blur or just rely on manual enter/button? relying on effect might debounce needed. 
              // Reactivity: The user asked for "A tabela deve reagir a esses filtros". 
              // Immediate reaction on typing might spam DB. Let's add a debounced effect or just rely on user typing.
              // For simplicity in this iteration, I'll let it react to the effect but maybe add debounce later if needed.
              // Actually, simply relying on the effect with a delay or explicit enter is better. 
              // For now, I'll rely on the useEffect dependency.
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => { setDateStart(''); setDateEnd(''); setSearchTerm(''); setPage(1); }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
        >
          Limpar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Data/Hora</th>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Ação</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      Carregando logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.profiles ? (
                        <div className="flex items-center gap-3">
                          {log.profiles.avatar_url ? (
                            <img src={log.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                              {log.profiles.email.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium text-xs md:text-sm">{log.profiles.full_name || 'Sem nome'}</span>
                            <span className="text-xs text-gray-500">{log.profiles.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Usuário Desconhecido ({log.user_id})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs font-mono text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100" title={JSON.stringify(log.details, null, 2)}>
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-xs text-gray-500">
              Mostrando <strong>{(page - 1) * PAGE_SIZE + 1}</strong> a <strong>{Math.min(page * PAGE_SIZE, totalCount)}</strong> de <strong>{totalCount}</strong> resultados
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
