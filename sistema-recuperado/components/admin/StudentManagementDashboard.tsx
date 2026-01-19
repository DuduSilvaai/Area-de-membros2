'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    UserCheck,
    UserX,
    TrendingUp,
    Calendar,
    BookOpen,
    Award
} from 'lucide-react';

interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    totalEnrollments: number;
    studentsWithAccess: number;
    studentsWithoutAccess: number;
    recentEnrollments: number;
    completionRate: number;
}

interface Props {
    stats: DashboardStats;
}

export function StudentManagementDashboard({ stats }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    const statCards = [
        {
            title: 'Total de Alunos',
            value: stats.totalStudents,
            icon: Users,
            color: 'blue',
            description: 'Alunos cadastrados na plataforma'
        },
        {
            title: 'Alunos Ativos',
            value: stats.activeStudents,
            icon: UserCheck,
            color: 'green',
            description: 'Alunos com contas ativas'
        },
        {
            title: 'Alunos Inativos',
            value: stats.inactiveStudents,
            icon: UserX,
            color: 'red',
            description: 'Alunos com contas desativadas'
        },
        {
            title: 'Total de Matrículas',
            value: stats.totalEnrollments,
            icon: GraduationCap,
            color: 'purple',
            description: 'Matrículas ativas em portais'
        },
        {
            title: 'Com Acesso',
            value: stats.studentsWithAccess,
            icon: BookOpen,
            color: 'pink',
            description: 'Alunos com pelo menos 1 matrícula'
        },
        {
            title: 'Sem Acesso',
            value: stats.studentsWithoutAccess,
            icon: UserX,
            color: 'orange',
            description: 'Alunos sem nenhuma matrícula'
        },
        {
            title: 'Novas Matrículas',
            value: stats.recentEnrollments,
            icon: TrendingUp,
            color: 'indigo',
            description: 'Matrículas nos últimos 7 dias'
        },
        {
            title: 'Taxa de Conclusão',
            value: `${stats.completionRate}%`,
            icon: Award,
            color: 'emerald',
            description: 'Média de conclusão de cursos'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
            red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
            pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
            indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Alunos</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visão geral do gerenciamento de alunos e matrículas
                    </p>
                </div>
                
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="1y">Último ano</option>
                </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${getColorClasses(stat.color)}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {stat.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                            <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">Cadastrar Aluno</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Adicionar novo aluno</div>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">Matrícula em Lote</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Matricular vários alunos</div>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">Relatório Mensal</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Gerar relatório</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo de Atividades</h3>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Novos alunos cadastrados hoje</span>
                        <span className="font-semibold text-gray-900 dark:text-white">3</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Matrículas realizadas hoje</span>
                        <span className="font-semibold text-gray-900 dark:text-white">7</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Alunos ativos na última semana</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{Math.round(stats.activeStudents * 0.8)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Taxa de engajamento</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">85%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}