// app/(admin)/portals/[portalId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layout, Settings } from 'lucide-react';
import { CourseBuilder } from '@/components/admin/CourseBuilder';
import { useState } from 'react';
import Link from 'next/link';

export default function PortalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const portalId = params.portalId as string;
    const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

    const handleBack = () => {
        router.push('/portals');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="container mx-auto p-6">
                {/* Header with Back Button */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
                            title="Voltar para Meus Portais"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Gestão do Portal
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gerencie conteúdos e configurações do seu portal
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'content'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Layout className="w-4 h-4" />
                            Conteúdos
                        </button>
                        <Link
                            href={`/portals/${portalId}/settings`}
                            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            <Settings className="w-4 h-4" />
                            Configurações
                        </Link>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'content' ? (
                        <CourseBuilder portalId={portalId} onBack={handleBack} />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
