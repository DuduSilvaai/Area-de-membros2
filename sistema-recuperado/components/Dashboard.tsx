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
  <div 
    style={{
      backgroundColor: '#FFFFFF',
      padding: '32px',
      borderRadius: '28px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
      border: '1px solid #E9ECEF',
    }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p style={{ fontSize: '14px', fontWeight: '500', color: '#636E72' }}>{title}</p>
        <p style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: '#1A1A1A' }}>{value}</p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', color: parseFloat(change) >= 0 ? '#00B894' : '#D63031' }}>
          <ArrowUpRight style={{ width: '16px', height: '16px', marginRight: '4px', transform: parseFloat(change) < 0 ? 'scaleY(-1)' : 'none' }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{change} vs mês passado</span>
        </div>
      </div>
      <div style={{ padding: '12px', backgroundColor: '#FFF0F5', borderRadius: '12px' }}>
        <Icon style={{ width: '24px', height: '24px', color: '#FF2D78' }} />
      </div>
    </div>
  </div>
);

// Componente de Gráfico (placeholder)
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div 
    style={{
      backgroundColor: '#FFFFFF',
      padding: '32px',
      borderRadius: '28px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
      border: '1px solid #E9ECEF',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <h3 style={{ fontWeight: '500', color: '#1A1A1A', marginBottom: '16px', fontSize: '16px' }}>{title}</h3>
    <div 
      style={{
        height: '256px',
        backgroundColor: '#F8F9FB',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#B2BEC3',
        fontSize: '14px',
        flex: 1,
      }}
    >
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
    <div 
      style={{
        backgroundColor: '#FFFFFF',
        padding: '32px',
        borderRadius: '28px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
        border: '1px solid #E9ECEF',
      }}
    >
      <h3 style={{ fontWeight: '500', color: '#1A1A1A', marginBottom: '16px', fontSize: '16px' }}>Atividades Recentes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              paddingBottom: '12px',
              borderBottom: '1px solid #E9ECEF',
            }}
            className="last:border-0 last:pb-0"
          >
            <div style={{ backgroundColor: '#FFF0F5', padding: '8px', borderRadius: '8px', marginRight: '12px', flexShrink: 0 }}>
              <Users style={{ width: '16px', height: '16px', color: '#FF2D78' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>{activity.user}</p>
              <p style={{ fontSize: '14px', color: '#636E72' }}>{activity.action}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#B2BEC3' }}>
              <Clock style={{ width: '12px', height: '12px', marginRight: '4px' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A' }}>Visão Geral</h1>
        <p style={{ color: '#636E72', marginTop: '8px', fontSize: '14px' }}>Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <ChartPlaceholder title="Desempenho de Vendas" />
        </div>
        <div>
          <ChartPlaceholder title="Metas do Mês" />
        </div>
      </div>

      {/* Atividades Recentes e Outras Seções */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <RecentActivity />
        </div>
        <div>
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              padding: '32px',
              borderRadius: '28px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
              border: '1px solid #E9ECEF',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontWeight: '500', color: '#1A1A1A', marginBottom: '16px', fontSize: '16px' }}>Próximos Eventos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#F0EBFF', color: '#7C3AED', padding: '8px', borderRadius: '8px', marginRight: '12px' }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>Reunião de Equipe</p>
                  <p style={{ fontSize: '12px', color: '#B2BEC3' }}>Amanhã, 10:00 AM</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#F0FDF4', color: '#16A34A', padding: '8px', borderRadius: '8px', marginRight: '12px' }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>Apresentação de Resultados</p>
                  <p style={{ fontSize: '12px', color: '#B2BEC3' }}>Sexta, 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
