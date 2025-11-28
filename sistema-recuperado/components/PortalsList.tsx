'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Users,
  Globe,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/UIComponents';
import { Button } from '@/components/UIComponents';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Portal {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

const PortalCard = ({ portal }: { portal: Portal }) => {
  const lastUpdated = portal.updated_at || portal.created_at;
  const timeAgo = lastUpdated
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })
    : 'Recentemente';

  return (
    <Link
      href={`/admin/contents?portalId=${portal.id}`}
      className="block group"
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <div className="h-2 bg-blue-500"></div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {portal.name}
            </h3>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Ativo
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
            {portal.description || 'Sem descrição'}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3 mt-auto">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>0 membros</span>
            </div>
            <span className="text-xs">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function PortalsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [portals, setPortals] = useState<Portal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('portals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortals(data || []);
    } catch (error) {
      console.error('Error fetching portals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPortals = portals.filter(portal =>
    portal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (portal.description && portal.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Portais</h1>
          <p className="text-gray-500">Gerencie seus portais e acessos</p>
        </div>
        <Link href="/teams/new" passHref>
          <Button variant="primary" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Portal
          </Button>
        </Link>
      </div>

      {/* Barra de busca */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Buscar portais..."
          className="pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de Portais */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredPortals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map((portal) => (
            <PortalCard key={portal.id} portal={portal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum portal encontrado</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm
              ? 'Nenhum portal corresponde à sua busca.'
              : 'Você ainda não possui portais criados.'}
          </p>
          <div className="mt-6">
            <Link href="/teams/new" passHref>
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}