'use client';

import React from 'react';
import {
  ArrowUpRight,
  Users,
  ShoppingCart,
  BarChart3,
  DollarSign,
  Calendar,
  Clock,
  BookOpen,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardProps {
  stats: {
    totalStudents: number;
    totalLessons: number;
    accessesToday: number;
    monthlyGrowth: { name: string; students: number }[];
    popularLessons: { name: string; accesses: number }[];
    recentActivity: any[];
  };
}

// Componente de Card reutilizável
const StatCard = ({
  title,
  value,
  // change, // Omitido por enquanto pois não temos dados históricos para comparar
  icon: Icon,
  trend
}: {
  title: string;
  value: string;
  // change?: string;
  icon: React.ElementType;
  trend?: string;
}) => (
  <div
    className="bg-[var(--bg-surface)] p-7 rounded-xl border-transparent dark:border-white/5 shadow-card dark:shadow-none relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider opacity-70">
          {title}
        </p>
        <p className="text-3xl font-extrabold text-[var(--text-primary)] m-0 tracking-tight">{value}</p>
        {/*
        <div className={`flex items-center mt-3 text-sm font-semibold ${parseFloat(change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <ArrowUpRight className={`w-3.5 h-3.5 mr-1 ${parseFloat(change || '0') < 0 ? 'scale-y-[-1]' : ''}`} />
          {change}
          <span className="text-gray-400 ml-1 font-medium text-xs">vs mês passado</span>
        </div>
        */}
      </div>
      <div className="p-4 rounded-2xl bg-pink-500/10 shadow-[0_8px_20px_rgba(255,45,120,0.1)] flex items-center justify-center">
        <Icon className="w-6 h-6 text-pink-500" />
      </div>
    </div>
  </div>
);

// Componente de Tabela Recente Atualizada
const RecentActivity = ({ activities }: { activities: any[] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] p-8 rounded-xl border-transparent dark:border-white/5 shadow-card dark:shadow-none">
        <h3 className="font-bold text-[var(--text-primary)] mb-6 text-lg">Atividades Recentes</h3>
        <p className="text-sm text-[var(--text-secondary)]">Nenhuma atividade recente encontrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] p-8 rounded-xl border-transparent dark:border-white/5 shadow-card dark:shadow-none transition-all duration-300 hover:shadow-lg">
      <h3 className="font-bold text-[var(--text-primary)] mb-6 text-lg">Atividades Recentes</h3>
      <div className="flex flex-col gap-1">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-center py-4 px-2 rounded-xl transition-colors hover:bg-[var(--bg-canvas)]/50 ${index < activities.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}
          >
            <div className="bg-pink-500/10 shadow-sm p-3 rounded-xl mr-4 flex-shrink-0">
              <Users className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {activity.profile?.full_name || activity.profile?.email || 'Usuário'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{activity.action}</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-[var(--text-secondary)] opacity-60">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {new Date(activity.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <div className="mb-2">
        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] m-0 tracking-tight">Visão Geral</h1>
        <p className="text-[var(--text-secondary)] mt-2.5 text-base font-medium opacity-80">
          Bem-vindo de volta! Aqui está o resumo atualizado do seu sistema.
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total de Alunos"
          value={stats.totalStudents.toString()}
          icon={Users}
        />
        <StatCard
          title="Total de Aulas"
          value={stats.totalLessons.toString()}
          icon={BookOpen}
        />
        <StatCard
          title="Acessos Hoje"
          value={stats.accessesToday.toString()}
          icon={Activity}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gráfico de Novos Alunos */}
        <div className="bg-[var(--bg-surface)] p-8 rounded-xl border-transparent dark:border-white/5 shadow-card dark:shadow-none transition-all duration-300 hover:shadow-lg">
          <h3 className="font-bold text-[var(--text-primary)] mb-8 text-lg">Novos Alunos por Mês</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CED4DA" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#636E72', fontSize: 12, fontWeight: 500 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#636E72', fontSize: 12, fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#FF2D78"
                  strokeWidth={4}
                  dot={{ fill: '#FF2D78', strokeWidth: 3, r: 5, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Aulas Populares */}
        <div className="bg-[var(--bg-surface)] p-8 rounded-xl border-transparent dark:border-white/5 shadow-card dark:shadow-none transition-all duration-300 hover:shadow-lg">
          <h3 className="font-bold text-[var(--text-primary)] mb-8 text-lg">Aulas Mais Populares (Top 5)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popularLessons} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#CED4DA" opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fill: '#636E72', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-canvas)', opacity: 0.4 }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                />
                <Bar
                  dataKey="accesses"
                  fill="#FF2D78"
                  radius={[0, 8, 8, 0]}
                  barSize={24}
                  background={{ fill: 'var(--bg-canvas)', radius: 8 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Atividades Recentes (e removi eventos futuros por ser fictício) */}
      <div className="grid grid-cols-1 gap-4">
        <RecentActivity activities={stats.recentActivity} />
      </div>
    </div>
  );
}

