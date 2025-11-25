'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { Input } from '@/components/UIComponents';
import { Button } from '@/components/UIComponents';

// Tipos para os usuários
type UserStatus = 'active' | 'pending' | 'blocked';
type UserRole = 'admin' | 'editor' | 'viewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  avatar?: string;
}

// Dados falsos para a tabela
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    role: 'admin',
    status: 'active',
    lastActive: 'Hoje, 10:30',
    avatar: '/avatars/joao.jpg'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    role: 'editor',
    status: 'active',
    lastActive: 'Ontem, 16:45',
    avatar: '/avatars/maria.jpg'
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    role: 'viewer',
    status: 'pending',
    lastActive: '2 dias atrás'
  },
  {
    id: '4',
    name: 'Ana Pereira',
    email: 'ana@empresa.com',
    role: 'editor',
    status: 'blocked',
    lastActive: '1 semana atrás'
  },
  {
    id: '5',
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    role: 'viewer',
    status: 'active',
    lastActive: 'Ontem, 09:15',
    avatar: '/avatars/pedro.jpg'
  }
];

// Componente de Badge para status
const StatusBadge = ({ status }: { status: UserStatus }) => {
  const statusConfig = {
    active: { text: 'Ativo', color: 'bg-green-100 text-green-800' },
    pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    blocked: { text: 'Bloqueado', color: 'bg-red-100 text-red-800' }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
      {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
      {status === 'blocked' && <XCircle className="h-3 w-3 mr-1" />}
      {statusConfig[status].text}
    </span>
  );
};

// Componente de Badge para cargo
const RoleBadge = ({ role }: { role: UserRole }) => {
  const roleConfig = {
    admin: { text: 'Administrador', color: 'bg-purple-100 text-purple-800' },
    editor: { text: 'Editor', color: 'bg-blue-100 text-blue-800' },
    viewer: { text: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[role].color}`}>
      {roleConfig[role].text}
    </span>
  );
};

// Componente principal
export default function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');

  // Filtrar usuários
  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' || 
      user.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // Contadores para as abas
  const countByStatus = MOCK_USERS.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, {} as Record<UserStatus, number>);

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Botão de Adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500">Gerencie os membros e suas permissões</p>
        </div>
        <Button 
          onClick={() => alert('Funcionalidade em breve')}
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Abas */}
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
          {[
            { id: 'all', label: 'Todos', count: MOCK_USERS.length },
            { id: 'active', label: 'Ativos', count: countByStatus.active || 0 },
            { id: 'pending', label: 'Pendentes', count: countByStatus.pending || 0 },
            { id: 'blocked', label: 'Bloqueados', count: countByStatus.blocked || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Barra de busca */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar usuários..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white shadow overflow-hidden border border-gray-200 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último acesso
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img className="h-full w-full object-cover" src={user.avatar} alt={user.name} />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => alert(`Editar usuário: ${user.name}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert(`Remover usuário: ${user.name}`)}
                          className="text-red-600 hover:text-red-900"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}