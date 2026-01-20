'use client';

import React from 'react';
import {
  Users,
  BookOpen,
  Activity,
  MessageSquare,
  Trophy,
  Zap,
  Clock,
  ArrowUpRight
} from 'lucide-react';


interface DashboardProps {
  stats: {
    totalStudents: number;
    totalLessons: number;
    accessesToday: number;
    commentsToday: number;
    latestComments: CommentItem[];
    topStudents: TopStudent[];
    recentActivity: ActivityItem[];
  };
}

interface CommentItem {
  id: string;
  text: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
  lesson_title: string;
}

interface TopStudent {
  id: string;
  name: string;
  email: string;
  access_count: number;
}

interface ActivityItem {
  id: string;
  action: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

// --- Holo UI Components ---

const HoloCard = ({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) => (
  <div className={`
    relative overflow-hidden rounded-[2rem]
    bg-white/60 dark:bg-[#0A0A0A]/80 backdrop-blur-xl
    border border-gray-200 dark:border-white/5
    ${glow ? 'shadow-[0_0_40px_-10px_rgba(255,0,128,0.15)]' : 'shadow-xl shadow-gray-200/50 dark:shadow-2xl dark:shadow-black/50'}
    transition-all duration-500 hover:shadow-2xl hover:-translate-y-1
    group
    ${className}
  `}>
    {/* Glass noise/texture overlay could go here */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-600/10 dark:from-pink-500/20 dark:to-purple-600/20 border border-pink-500/10 dark:border-white/5 backdrop-blur-md shadow-lg shadow-pink-500/5">
      <Icon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs font-medium text-gray-500 dark:text-zinc-500">{subtitle}</p>}
    </div>
  </div>
);

// --- Widgets ---

const StatWidget = ({ title, value, icon: Icon, trend, subValue, gradient = 'from-pink-500 to-purple-600' }: any) => (
  <HoloCard className="p-6 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-pink-500/20 text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-400/20">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
    <div>
      <h4 className="text-gray-500 dark:text-zinc-400 text-sm font-medium mb-1 tracking-wide">{title}</h4>
      <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-lg">{value}</p>
      {subValue && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-sm font-medium text-gray-500 dark:text-zinc-500 flex items-center gap-2">
          {subValue}
        </div>
      )}
    </div>
  </HoloCard>
);

const LatestCommentsWidget = ({ comments }: { comments: CommentItem[] }) => (
  <HoloCard className="p-8 h-full">
    <SectionTitle icon={MessageSquare} title="Conversas Recentes" subtitle="O que os franqueados estão dizendo" />

    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-zinc-600">
          <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
          <p>Sem comentários ainda</p>
        </div>
      ) : (
        comments.map((comment, idx) => (
          <div key={comment.id} className="group flex gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.04] hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 shadow-sm dark:shadow-none hover:shadow-md">
            <div className="shrink-0 pt-1">
              {comment.user_avatar ? (
                <img src={comment.user_avatar} className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-white/10 shadow-sm" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 border border-gray-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400 shadow-inner">
                  {comment.user_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-900 dark:text-zinc-200 text-sm">{comment.user_name}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-900/50 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5 whitespace-nowrap ml-2">
                  {new Date(comment.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-500/80 mb-2 truncate">{comment.lesson_title}</p>
              <div className="relative">
                <div className="absolute left-[-18px] top-2 w-[2px] h-full bg-gradient-to-b from-gray-200 to-transparent dark:from-white/10 dark:to-transparent rounded-full" />
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-2 pl-0 group-hover:text-gray-900 dark:group-hover:text-zinc-300 transition-colors">
                  "{comment.text}"
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

    <button className="w-full mt-6 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all uppercase tracking-wider hover:shadow-sm">
      Ver Todas
    </button>
  </HoloCard>
);

const LeaderboardWidget = ({ students }: { students: TopStudent[] }) => (
  <HoloCard className="p-8 h-full bg-gradient-to-b from-white/80 to-white/40 dark:from-[#0A0A0A]/90 dark:to-[#0A0A0A]/50">
    <SectionTitle icon={Trophy} title="Top Franqueados" subtitle="Mais engajados nos últimos 30 dias" />

    <div className="space-y-2">
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-zinc-600">
          <Trophy className="w-8 h-8 mb-2 opacity-50" />
          <p>Sem dados suficientes</p>
        </div>
      ) : (
        students.map((student, index) => (
          <div key={student.id} className="relative flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`
                w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-sm border shadow-lg
                ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-300/20 text-white shadow-amber-500/20' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 border-slate-300/20 text-white shadow-slate-500/20' :
                    index === 2 ? 'bg-gradient-to-br from-amber-700 to-orange-800 border-orange-400/20 text-white shadow-orange-900/20' :
                      'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-white/5 text-gray-500 dark:text-zinc-500'}
              `}>
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-200 truncate group-hover:text-black dark:group-hover:text-white transition-colors">{student.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate group-hover:text-gray-700 dark:group-hover:text-zinc-400 transition-colors">{student.email}</p>
              </div>
            </div>
            <div className="text-right pl-4">
              <span className="block text-lg font-black text-gray-900 dark:text-white">{student.access_count}</span>
              <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">Acessos</span>
            </div>
          </div>
        ))
      )}
    </div>
  </HoloCard>
);

// --- Main Page ---

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="min-h-screen w-full text-gray-900 dark:text-zinc-100 font-sans selection:bg-pink-500/30">

      {/* Header */}
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-up">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold tracking-wider uppercase">
              Admin Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest">Online</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            Visão Geral
          </h1>
          <p className="text-gray-500 dark:text-zinc-500 font-medium text-lg leading-relaxed">
            Acompanhe o crescimento da sua comunidade e o engajamento dos seus franqueados em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/50">
          <div className="p-2 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Atualizado em</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 grid-rows-[auto_auto] animate-fade-in-up [animation-delay:200ms]">

        {/* Stats Row */}
        <div className="lg:col-span-4 h-full">
          <StatWidget
            title="Total de Franqueados"
            value={stats.totalStudents.toString()}
            icon={Users}
            trend="+3 novos"
            subValue={
              <span className="flex items-center text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-400/10 px-2 py-0.5 rounded-md border border-pink-200 dark:border-pink-400/20">
                <MessageSquare className="w-3 h-3 mr-1.5" />
                {stats.commentsToday} interações hoje
              </span>
            }
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <StatWidget
            title="Total de Conteúdos"
            value={stats.totalLessons.toString()}
            icon={BookOpen}
            gradient="from-cyan-500 to-blue-600"
            subValue={<span>Biblioteca de conteúdo ativa</span>}
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <StatWidget
            title="Acessos Hoje"
            value={stats.accessesToday.toString()}
            icon={Zap}
            gradient="from-emerald-400 to-teal-500"
            subValue={<span>Franqueados ativos na plataforma</span>}
          />
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-7 h-[500px]">
          <LatestCommentsWidget comments={stats.latestComments} />
        </div>

        <div className="lg:col-span-5 h-[500px]">
          <LeaderboardWidget students={stats.topStudents} />
        </div>

      </div>
    </div>
  );
}
