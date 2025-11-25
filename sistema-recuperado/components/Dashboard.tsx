'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';

// Componente de Card reutilizável
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon 
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className={`flex items-center mt-2 ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <ArrowUpRight className={`w-4 h-4 mr-1 ${parseFloat(change) < 0 ? 'transform rotate-180' : ''}`} />
          <span className="text-sm font-medium">{change} vs mês passado</span>
        </div>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

// Componente de Gráfico (placeholder)
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
    <h3 className="font-medium text-gray-700 mb-4">{title}</h3>
    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
      Gráfico de {title}
    </div>
  </div>
);

// Componente de Tabela Recente
const RecentActivity = () => {
  const activities = [
    { id: 1, user: 'João Silva', action: 'Criou um novo time', time: '2 min atrás' },
    { id: 2, user: 'Maria Santos', action: 'Atualizou o portal', time: '1 hora atrás' },
    { id: 3, user: 'Carlos Oliveira', action: 'Enviou relatório', time: '3 horas atrás' },
    { id: 4, user: 'Ana Pereira', action: 'Adicionou novo membro', time: '5 horas atrás' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-medium text-gray-700 mb-4">Atividades Recentes</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{activity.user}</p>
              <p className="text-sm text-gray-500">{activity.action}</p>
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {activity.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Usuários" 
          value="1,248" 
          change="+12.5%" 
          icon={Users} 
        />
        <StatCard 
          title="Vendas do Mês" 
          value="R$ 48,290" 
          change="+8.2%" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Novos Clientes" 
          value="89" 
          change="-2.4%" 
          icon={Users} 
        />
        <StatCard 
          title="Pedidos" 
          value="1,245" 
          change="+18.3%" 
          icon={ShoppingCart} 
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartPlaceholder title="Desempenho de Vendas" />
        </div>
        <div>
          <ChartPlaceholder title="Metas do Mês" />
        </div>
      </div>

      {/* Atividades Recentes e Outras Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="font-medium text-gray-700 mb-4">Próximos Eventos</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-purple-100 text-purple-800 p-2 rounded-lg mr-3">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Reunião de Equipe</p>
                  <p className="text-xs text-gray-500">Amanhã, 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-100 text-green-800 p-2 rounded-lg mr-3">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Apresentação de Resultados</p>
                  <p className="text-xs text-gray-500">Sexta, 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}