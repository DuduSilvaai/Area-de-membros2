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
      backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
      padding: '28px',
      borderRadius: '20px',
      boxShadow: '0 10px 32px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ 
          fontSize: '11px', 
          fontWeight: '700', 
          color: '#999999', 
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {title}
        </p>
        <p style={{ fontSize: '32px', fontWeight: '600', marginTop: '0px', color: '#1A1A1A' }}>{value}</p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', color: parseFloat(change) >= 0 ? '#00B894' : '#D63031', fontSize: '13px', fontWeight: '600' }}>
          <ArrowUpRight style={{ width: '14px', height: '14px', marginRight: '4px', transform: parseFloat(change) < 0 ? 'scaleY(-1)' : 'none' }} />
          {change}
          <span style={{ color: '#999999', marginLeft: '4px', fontWeight: '500' }}>vs mês passado</span>
        </div>
      </div>
      <div style={{ 
        padding: '16px', 
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #FFF0F5 0%, #FFE8F0 100%)',
        boxShadow: '0 8px 20px rgba(255, 45, 120, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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
      backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
      padding: '28px',
      borderRadius: '20px',
      boxShadow: '0 10px 32px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <h3 style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '16px', fontSize: '16px' }}>{title}</h3>
    <div 
      style={{
        height: '256px',
        backgroundColor: '#F9F9FB',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#CCCCCC',
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
        backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
        padding: '28px',
        borderRadius: '20px',
        boxShadow: '0 10px 32px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <h3 style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '20px', fontSize: '16px' }}>Atividades Recentes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              paddingBottom: '16px',
              borderBottom: index < activities.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
            }}
          >
            <div style={{ 
              backgroundColor: '#FFF0F5',
              boxShadow: '0 4px 12px rgba(255, 45, 120, 0.12)',
              padding: '10px', 
              borderRadius: '10px', 
              marginRight: '14px', 
              flexShrink: 0 
            }}>
              <Users style={{ width: '16px', height: '16px', color: '#FF2D78' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{activity.user}</p>
              <p style={{ fontSize: '13px', color: '#888888', marginTop: '2px' }}>{activity.action}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#AAAAAA' }}>
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
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Visão Geral</h1>
        <p style={{ color: '#888888', marginTop: '8px', fontSize: '14px', margin: '8px 0 0 0' }}>Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', gridAutoFlow: 'dense' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <ChartPlaceholder title="Desempenho de Vendas" />
        </div>
        <div>
          <ChartPlaceholder title="Metas do Mês" />
        </div>
      </div>

      {/* Atividades Recentes e Próximos Eventos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <RecentActivity />
        </div>
        <div>
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
              padding: '28px',
              borderRadius: '20px',
              boxShadow: '0 10px 32px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h3 style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '16px', fontSize: '16px' }}>Próximos Eventos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ 
                  backgroundColor: '#F0EBFF', 
                  color: '#7C3AED', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  marginRight: '12px',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.12)',
                }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>Reunião de Equipe</p>
                  <p style={{ fontSize: '12px', color: '#AAAAAA', marginTop: '2px' }}>Amanhã, 10:00 AM</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ 
                  backgroundColor: '#F0FDF4', 
                  color: '#16A34A', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  marginRight: '12px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.12)',
                }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>Apresentação de Resultados</p>
                  <p style={{ fontSize: '12px', color: '#AAAAAA', marginTop: '2px' }}>Sexta, 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
