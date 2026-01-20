'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layout, Settings, Users } from 'lucide-react';
import { CourseTree } from '@/components/admin/CourseTree';
import { BrandingForm } from '@/components/admin/BrandingForm';
import { StudentList } from '@/components/admin/StudentList';
import { AccessManager } from '@/components/admin/AccessManager';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Portal } from '@/types/enrollment';

export default function PortalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const portalId = params.portalId as string;
    const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'students'>('content');
    const [portal, setPortal] = useState<Portal | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchPortal = async () => {
            const { data } = await supabase.from('portals').select('*').eq('id', portalId).single();
            setPortal(data as unknown as Portal);
            setLoading(false);
        };
        fetchPortal();
    }, [portalId]);

    const handleBack = () => {
        router.push('/portals');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-zinc-500 font-medium">Carregando painel...</div>
        </div>
    );

    if (!portal) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-red-500 font-medium">Portal não encontrado.</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0F0F12] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#FF2D78] selection:text-white pb-20">
            <div className="container mx-auto p-6 md:p-8 max-w-7xl space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={handleBack}
                            className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all border border-zinc-800 text-zinc-400 hover:text-white group"
                            title="Voltar"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                {portal.name}
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                Painel de Controle
                            </p>
                        </div>
                    </div>

                    {/* Underline Tabs */}
                    <div className="flex gap-8 border-b border-zinc-800 self-start md:self-auto w-full md:w-auto overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex items-center gap-2 pb-3 px-2 text-base font-medium transition-all whitespace-nowrap border-b-2 ${activeTab === 'content'
                                ? 'border-[#FF2D78] text-zinc-900 dark:text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Layout className={`w-4 h-4 ${activeTab === 'content' ? 'text-[#FF2D78]' : ''}`} />
                            Estrutura
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 pb-3 px-2 text-base font-medium transition-all whitespace-nowrap border-b-2 ${activeTab === 'settings'
                                ? 'border-[#FF2D78] text-zinc-900 dark:text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#FF2D78]' : ''}`} />
                            Aparência
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex items-center gap-2 pb-3 px-2 text-base font-medium transition-all whitespace-nowrap border-b-2 ${activeTab === 'students'
                                ? 'border-[#FF2D78] text-zinc-900 dark:text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-[#FF2D78]' : ''}`} />
                            Franqueados
                        </button>
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="relative min-h-[500px]">
                    {activeTab === 'content' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <CourseTree portalId={portalId} />
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <BrandingForm portal={portal} />
                        </div>
                    )}
                    {activeTab === 'students' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            {/* <StudentList portalId={portalId} /> */}
                            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-[#27272A] p-6 min-h-[600px] flex flex-col shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#FF2D78]" />
                                        Gestão de Franqueados
                                    </h2>
                                    <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                                        Gerencie quem tem acesso a este portal.
                                    </p>
                                </div>
                                <div className="flex-1 relative">
                                    <AccessManager context="portal" portalId={portalId} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
