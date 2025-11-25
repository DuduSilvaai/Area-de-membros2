'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // <--- O IMPORT CORRETO
import { Users, Video, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Busca os últimos 5 logs
      const { data: logsData, error } = await supabase
        .from('access_logs')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLogs(logsData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>

      {/* Cards de Estatística (Fictícios por enquanto) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500">Total de Alunos</p><p className="text-2xl font-bold">124</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Video size={24} /></div>
          <div><p className="text-sm text-gray-500">Aulas Cadastradas</p><p className="text-2xl font-bold">42</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Activity size={24} /></div>
          <div><p className="text-sm text-gray-500">Acessos Hoje</p><p className="text-2xl font-bold">18</p></div>
        </div>
      </div>

      {/* Tabela de Logs Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Últimas Atividades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Ação</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Nenhum registro encontrado.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4">{log.profiles?.email || log.user_id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}