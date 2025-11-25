'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Settings, 
  Users,
  FileText,
  BarChart2,
  Globe
} from 'lucide-react';
import { Input } from '@/components/UIComponents';
import { Button } from '@/components/UIComponents';

// Tipos para os portais
type PortalTheme = 'standard' | 'premium' | 'enterprise';

interface Portal {
  id: string;
  name: string;
  url: string;
  theme: PortalTheme;
  members: number;
  description: string;
  lastUpdated: string;
}

// Dados falsos para os portais
const MOCK_PORTALS: Portal[] = [
  {
    id: '1',
    name: 'Portal de Vendas',
    url: 'vendas.meudominio.com',
    theme: 'premium',
    members: 12,
    description: 'Portal dedicado à equipe de vendas',
    lastUpdated: 'há 2 horas'
  },
  {
    id: '2',
    name: 'Portal de Suporte',
    url: 'suporte.meudominio.com',
    theme: 'standard',
    members: 8,
    description: 'Central de atendimento ao cliente',
    lastUpdated: 'ontem'
  },
  {
    id: '3',
    name: 'Portal de Marketing',
    url: 'marketing.meudominio.com',
    theme: 'enterprise',
    members: 15,
    description: 'Estratégias e campanhas de marketing',
    lastUpdated: 'há 3 dias'
  },
  {
    id: '4',
    name: 'Portal Financeiro',
    url: 'financeiro.meudominio.com',
    theme: 'premium',
    members: 5,
    description: 'Gestão financeira e relatórios',
    lastUpdated: 'há 1 semana'
  }
];

// Componente de Card de Portal
const PortalCard = ({ portal }: { portal: Portal }) => {
  const themeColors = {
    standard: { bg: 'bg-gray-100', text: 'text-gray-700' },
    premium: { bg: 'bg-blue-50', text: 'text-blue-700' },
    enterprise: { bg: 'bg-purple-50', text: 'text-purple-700' }
  };

  const { bg, text } = themeColors[portal.theme] || themeColors.standard;

  return (
    <Link 
      href={`/portals/${portal.id}`}
      className="block group"
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <div className={`h-2 ${bg}`}></div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {portal.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
              {portal.theme.charAt(0).toUpperCase() + portal.theme.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4 flex-1">{portal.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3 mt-auto">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{portal.members} membros</span>
            </div>
            <span className="text-xs">{portal.lastUpdated}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Componente principal
export default function PortalsList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPortals = MOCK_PORTALS.filter(portal =>
    portal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portal.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      {filteredPortals.length > 0 ? (
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